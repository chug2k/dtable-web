import os
import jwt
import time
import requests
import json
import logging
from urllib.parse import urljoin

from django.core.cache import cache

from seahub.dtable.models import DTableShare, Workspaces, DTableFormShare, DTables, DTableGroupShare
from seahub.group.utils import is_group_member, is_group_admin_or_owner
from seahub.constants import PERMISSION_READ_WRITE, ORG_DEFAULT

from seaserv import ccnet_api, seafile_api

from seahub.organizations.models import OrgSettings
from seahub.role_permissions.utils import get_enabled_role_permissions_by_role
from seahub.utils import get_service_url, normalize_cache_key
from seahub.utils.file_size import get_quota_from_string
from seahub.settings import DTABLE_PRIVATE_KEY, DTABLE_EVENTS_IO_SERVER_URL

logger = logging.getLogger(__name__)

UPLOAD_IMG_RELATIVE_PATH = 'images'
UPLOAD_FILE_RELATIVE_PATH = 'files'

FORM_UPLOAD_IMG_RELATIVE_PATH = 'forms'

# form share type
ANONYMOUS = 'anonymous'
LOGIN_USERS = 'login_users'
SHARED_GROUPS = 'shared_groups'

# .dtable
FILE_TYPE = '.dtable'


def check_dtable_permission(username, workspace, dtable=None, org_id=None):
    """Check workspace/dtable access permission of a user.
    """
    owner = workspace.owner

    if '@seafile_group' in owner:
        group_id = int(owner.split('@')[0])
        if is_group_member(group_id, username):
            return PERMISSION_READ_WRITE
    else:
        if username == owner:
            return PERMISSION_READ_WRITE

    if dtable:  # check user's all permissions from `share`, `group-share` and checkout higher one
        dtable_share = DTableShare.objects.get_by_dtable_and_to_user(dtable, username)
        if dtable_share and dtable_share.permission == PERMISSION_READ_WRITE:
            return dtable_share.permission
        permission = dtable_share.permission if dtable_share else None

        if org_id and org_id > 0:
            groups = ccnet_api.get_org_groups_by_user(org_id, username)
        else:
            groups = ccnet_api.get_groups(username, return_ancestors=True)
        group_ids = [group.id for group in groups]
        group_permissions = DTableGroupShare.objects.filter(dtable=dtable, group_id__in=group_ids).values_list('permission', flat=True)
        for group_permission in group_permissions:
            permission = permission if permission else group_permission
            if group_permission == PERMISSION_READ_WRITE:
                return group_permission
        return permission

    return None


def check_dtable_admin_permission(username, owner):
    """Check workspace/dtable access permission of an admin.
    """
    if '@seafile_group' in owner:
        group_id = int(owner.split('@')[0])
        if is_group_admin_or_owner(group_id, username):
            return True
        else:
            return False

    else:
        if username == owner:
            return True
        else:
            return False


def list_dtable_related_users(workspace, dtable):
    """ Return all users who can view this dtable.

    1. owner
    2. shared users
    3. groups users
    """

    user_list = list()
    owner = workspace.owner

    # 1. shared users
    shared_queryset = DTableShare.objects.list_by_dtable(dtable)
    user_list.extend([dtable_share.to_user for dtable_share in shared_queryset])

    if '@seafile_group' not in owner:
        # 2. owner
        if owner not in user_list:
            user_list.append(owner)
    else:
        # 3. groups users
        group_id = int(owner.split('@')[0])
        members = ccnet_api.get_group_members(group_id)
        for member in members:
            if member.user_name not in user_list:
                user_list.append(member.user_name)

    return user_list


def gen_share_dtable_link(token):
    service_url = get_service_url()
    assert service_url is not None
    service_url = service_url.rstrip('/')
    return '%s/dtable/links/%s' % (service_url, token)


def gen_dtable_external_link(token):
    service_url = get_service_url()
    assert service_url is not None
    service_url = service_url.rstrip().rstrip('/')
    return '%s/dtable/external-links/%s/' % (service_url, token)


def is_valid_jwt(auth, dtable_uuid):
    if not auth or auth[0].lower() != 'token' or len(auth) != 2:
        return False

    token = auth[1]
    if not token or not dtable_uuid:
        return False

    try:
        payload = jwt.decode(token, DTABLE_PRIVATE_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return False
    if payload['dtable_uuid'] != dtable_uuid:
        return False

    return True


def create_repo_and_workspace(owner, org_id):
    repo_id = seafile_api.create_repo(
        "My Workspace",
        "My Workspace",
        "dtable@seafile"
    )

    workspace = Workspaces.objects.create_workspace(owner, repo_id, org_id)
    return workspace


def check_form_submit_permission(request, form):
    share_type = form.share_type
    is_auth = request.user.is_authenticated()
    username = request.user.username

    if is_auth and username == form.username:
        return True

    if share_type == ANONYMOUS:
        return True
    elif share_type == LOGIN_USERS and is_auth: 
        return True
    elif share_type == SHARED_GROUPS and is_auth:
        user_groups = ccnet_api.get_groups(request.user.username)
        user_group_ids = [group.id for group in user_groups]
        shared_group_ids = DTableFormShare.objects.list_by_form(form)
        intersection = [group_id for group_id in user_group_ids if group_id in shared_group_ids]
        if intersection:
            return True

    return False


def convert_dtable_trash_names(dtable):
    """
    convert dtable's name to trash name and generate old and new .dtable names
    """
    assert dtable.deleted is False
    new_dtable_name = '_(deleted_' + str(dtable.id) + ') ' + dtable.name
    old_dtable_file_name = dtable.name + FILE_TYPE
    new_dtable_file_name = new_dtable_name + FILE_TYPE

    return new_dtable_name, old_dtable_file_name, new_dtable_file_name


def restore_trash_dtable_names(dtable):
    """
    get trash dtable's original name and generate old and new .dtable names
    """
    assert dtable.deleted is True
    new_dtable_name = dtable.name[dtable.name.find(' ')+1:]
    old_dtable_file_name = dtable.name + FILE_TYPE
    new_dtable_file_name = new_dtable_name + FILE_TYPE

    return new_dtable_name, old_dtable_file_name, new_dtable_file_name


def add_dtable_io_task(type, params):

    payload = {'exp': int(time.time()) + 300, }
    token = jwt.encode(payload, DTABLE_PRIVATE_KEY, algorithm='HS256')
    headers = {"Authorization": "Token %s" % token.decode()}
    if type == 'export':
        url = urljoin(DTABLE_EVENTS_IO_SERVER_URL, '/add-export-task')
    elif type == 'import':
        url = urljoin(DTABLE_EVENTS_IO_SERVER_URL, '/add-import-task')

    resp = requests.get(url, params=params, headers=headers)
    if not resp.ok:
        logger.error(resp.content)
        raise Exception

    return json.loads(resp.content)['task_id']


def query_dtable_io_status(task_id):
    payload = {'exp': int(time.time()) + 300, }
    token = jwt.encode(payload, DTABLE_PRIVATE_KEY, algorithm='HS256')
    headers = {"Authorization": "Token %s" % token.decode()}
    url = urljoin(DTABLE_EVENTS_IO_SERVER_URL, '/query-status')
    params = {'task_id': task_id}

    resp = requests.get(url, params=params, headers=headers)
    return resp


def cancel_dtable_io_task(task_id, dtable_uuid):
    payload = {'exp': int(time.time()) + 300, }
    token = jwt.encode(payload, DTABLE_PRIVATE_KEY, algorithm='HS256')
    headers = {"Authorization": "Token %s" % token.decode()}
    url = urljoin(DTABLE_EVENTS_IO_SERVER_URL, '/cancel-task')
    params = {'task_id': task_id, 'dtable_uuid': dtable_uuid}

    resp = requests.get(url, params=params, headers=headers)
    return resp


ASSET_SIZE_CACHE_PREFIX = 'ASSET_SIZE_'
ASSET_SIZE_CACHE_TIMEOUT = 24 * 60 * 60


def check_user_workspace_quota(workspace):
    """
    check workspace is whether valid about quota
    """
    # if workspace is a group workspace and not a org workspace, don't need to check
    # because users are not allowed to create groups but org users can
    if '@seafile_group' in workspace.owner and workspace.org_id == -1:
        return True
    if workspace.org_id != -1:  # org workspace, check the sum of the org's all workspace size is whether valid
        org_role = OrgSettings.objects.filter(org_id=workspace.org_id).first()
        org_role = org_role.role if org_role else ORG_DEFAULT
        quota = get_enabled_role_permissions_by_role(org_role).get('role_asset_quota', '')
        quota = get_quota_from_string(quota) if quota else quota
        if quota:
            asset_size = cache.get(normalize_cache_key(str(workspace.org_id), ASSET_SIZE_CACHE_PREFIX))
            if not asset_size:
                repo_ids = Workspaces.objects.filter(org_id=workspace.org_id).values_list('repo_id', flat=True)
                asset_size = 0
                for repo_id in repo_ids:
                    asset_size += seafile_api.get_repo_size(repo_id)
                cache.set(normalize_cache_key(str(workspace.id), ASSET_SIZE_CACHE_PREFIX), asset_size, ASSET_SIZE_CACHE_TIMEOUT)
            if int(asset_size) > quota:
                return False
    else:  # check user's workspace size
        user = ccnet_api.get_emailuser_with_import(workspace.owner)
        if not user:
            return False
        quota = get_enabled_role_permissions_by_role(user.role).get('role_asset_quota', '')
        quota = get_quota_from_string(quota) if quota else quota
        if quota and seafile_api.get_repo_size(workspace.repo_id) > quota:
            return False
    return True
