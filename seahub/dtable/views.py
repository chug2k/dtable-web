# -*- coding: utf-8 -*-
import os
import time
import logging
from urllib import request as requests
import jwt
import json
import mimetypes
import hashlib
from email.utils import formatdate

from django.core.urlresolvers import reverse
from django.views.decorators.cache import cache_control
from django.http import Http404, HttpResponseRedirect, HttpResponse
from django.db.models import F
from django.shortcuts import render
from django.utils.translation import ugettext as _
from django.utils.http import urlquote, quote_etag

import seaserv
from seaserv import seafile_api, ccnet_api

from seahub import settings
from seahub.auth.models import AnonymousUser
from seahub.base.templatetags.seahub_tags import email2nickname
from seahub.dtable.models import Workspaces, DTables, DTableForms, DTableShareLinks, \
    DTableRowShares, DTableShare, SeafileConnectors, DTableSnapshot, DTablePlugins, \
    DTableFormShare, DTableExternalLinks
from seahub.dtable.signals import share_dtable_to_user
from seahub.utils import normalize_file_path, render_error, render_permission_error, \
     gen_file_get_url, get_file_type_and_ext, gen_inner_file_get_url
from seahub.utils.file_types import *
from seahub.auth.decorators import login_required
from seahub.settings import DTABLE_SERVER_URL, DTABLE_SOCKET_URL, MEDIA_URL, \
    DTABLE_PRIVATE_KEY, FILE_ENCODING_LIST, DTABLE_WEB_SERVICE_URL, POWERED_BY_LINK, DTABLE_BAIDU_MAP_KEY, \
    DTABLE_GOOGLE_MAP_KEY, DTABLE_ENABLE_GEOLOCATION_COLUMN, SEATABLE_MARKET_URL
from seahub.dtable.utils import check_dtable_permission, list_dtable_related_users, FORM_UPLOAD_IMG_RELATIVE_PATH, \
    check_form_submit_permission, SHARED_GROUPS, check_user_workspace_quota
from seahub.constants import PERMISSION_ADMIN, PERMISSION_READ_WRITE, PERMISSION_READ
from seahub.views.file import get_file_content
from seahub.utils.auth import get_login_bg_image_path
from seahub.group.utils import group_id_to_name
from seahub.dtable.utils import add_dtable_io_task, query_dtable_io_status, is_group_admin_or_owner

logger = logging.getLogger(__name__)

FILE_TYPE = '.dtable'
WRITE_PERMISSION_TUPLE = (PERMISSION_READ_WRITE, PERMISSION_ADMIN)
SEATABLE_VERSION = getattr(settings, 'SEATABLE_VERSION', 'Dev')


def conditional_browser_cache(func):
    """
    To use this decorator to set conditional cache headers,
    timepstamp 't' in request.GET is required,
    and 't' is supposed to be in millisecond.
    """
    def wrapper(*args, **kwargs):
        request = args[0]
        timestamp = request.GET.get('t', '')
        if timestamp:
            etag = quote_etag(hashlib.md5(timestamp.encode('utf-8')).hexdigest())
            last_modified = formatdate(timeval=int(timestamp) // 1000, localtime=False, usegmt=True)
        else:
            etag = ''
            last_modified = ''

        if_none_match_etags = request.META.get('HTTP_IF_NONE_MATCH', '')
        if_modified_since = request.META.get('HTTP_IF_MODIFIED_SINCE', '')
        if ((if_none_match_etags and if_none_match_etags == etag) or
            (if_modified_since and if_modified_since == last_modified)):
            response = HttpResponse(status=304)
            response['ETag'] = etag
            response['Last-Modified'] = last_modified
            return response

        response = func(*args, **kwargs)
        response['ETag'] = etag
        response['Last-Modified'] = last_modified
        return response
    return wrapper


@login_required
def dtable_file_view(request, workspace_id, name):
    """

    Permission:
    1. owner
    2. group member
    3. shared user
    """
    # resource check
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        return render_error(request, 'Workspace does not exist.')
    
    group_id = ''
    if '@seafile_group' in workspace.owner:
        group_id = workspace.owner.split('@')[0]
        group = seaserv.get_group(group_id)
        if not group:
            error_msg = 'Group %s not found.' % group_id
            return render_error(request, error_msg)

    repo_id = workspace.repo_id
    repo = seafile_api.get_repo(repo_id)
    if not repo:
        return render_error(request, 'Library does not exist.')

    dtable = DTables.objects.get_dtable(workspace, name)
    if not dtable:
        return render_error(request, 'DTable does not exist.')

    # permission check
    username = request.user.username
    permission = check_dtable_permission(username, workspace, dtable)
    if not permission:
        return render_permission_error(request, _('Permission denied.'))
    
    is_admin = False
    if group_id:
        is_admin = is_group_admin_or_owner(group_id, username)
    else:
        # open your own dtable
        is_admin = username == workspace.owner

    seafile_url = ''
    repo_api_token = ''
    try:
        seafile_connector = SeafileConnectors.objects.get(dtable=dtable)
        seafile_url = seafile_connector.seafile_url
        repo_api_token = seafile_connector.repo_api_token
    except SeafileConnectors.DoesNotExist:
        pass

    return_dict = {
        'version': SEATABLE_VERSION,
        'dtable_baidu_map_key': DTABLE_BAIDU_MAP_KEY,
        'dtable_google_map_key': DTABLE_GOOGLE_MAP_KEY,
        'seatable_market_url': SEATABLE_MARKET_URL,
        'filename': name,
        'workspace_id': workspace_id,
        'dtable_uuid': dtable.uuid.hex,
        'permission': permission if check_user_workspace_quota(workspace) else 'r',
        'media_url': MEDIA_URL,
        'seafile_url': seafile_url,
        'repo_api_token': repo_api_token,
        'dtable_server': DTABLE_SERVER_URL,
        'dtable_socket': DTABLE_SOCKET_URL,
        'dtable_enable_geolocation_column': DTABLE_ENABLE_GEOLOCATION_COLUMN,
        'is_admin': is_admin,
        'asset_quota_exceeded': dtable.creator == request.user.username and not check_user_workspace_quota(workspace),
    }

    return render(request, 'dtable_file_view_react.html', return_dict)


def _dtable_asset_access(request, workspace_id, dtable_id, path, asset_name):
    # resource check
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        return render_error(request, 'Workspace does not exist.')

    repo_id = workspace.repo_id
    repo = seafile_api.get_repo(repo_id)
    if not repo:
        return render_error(request, 'Library does not exist.')

    dtable = DTables.objects.get_dtable_by_uuid(dtable_id)
    if not dtable:
        return render_error(request, 'DTable does not exist.')

    # use head method to check asset at 'path' wether exists
    if request.method == 'HEAD':
        asset_path = normalize_file_path(os.path.join('/asset', dtable_id, path))
        asset_id = seafile_api.get_file_id_by_path(repo_id, asset_path)
        if not asset_id:
            return HttpResponse(status=404)
        return HttpResponse(status=200)

    asset_path = normalize_file_path(os.path.join('/asset', dtable_id, path))
    asset_id = seafile_api.get_file_id_by_path(repo_id, asset_path)
    if not asset_id:
        return render_error(request, 'Asset file does not exist.')

    # permission check
    username = request.user.username
    if not (check_dtable_permission(username, workspace, dtable) in WRITE_PERMISSION_TUPLE or \
        (get_file_type_and_ext(asset_name)[0] == IMAGE and request.session.get('external_link') and request.session.get('external_link')['dtable_uuid'] == dtable.uuid.hex)):
        return render_permission_error(request, _('Permission denied.'))

    dl = request.GET.get('dl', '0') == '1'
    operation = 'download' if dl else 'view'

    token = seafile_api.get_fileserver_access_token(
        repo_id, asset_id, operation, '', use_onetime=False
    )

    url = gen_file_get_url(token, asset_name)

    return HttpResponseRedirect(url)


def dtable_asset_access(request, workspace_id, dtable_id, path):
    """

    Permission:
    1. owner
    2. group member
    3. shared user with `rw` or `admin` permission
    """
    asset_name = os.path.basename(normalize_file_path(path))

    if get_file_type_and_ext(asset_name)[0] == IMAGE:
        return _dtable_asset_access(request, workspace_id, dtable_id, path, asset_name)
    else:
        return login_required(_dtable_asset_access)(request, workspace_id, dtable_id, path, asset_name)


@login_required
def dtable_asset_preview(request, workspace_id, dtable_id, path):

    # resource check
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        return render_error(request, 'Workspace does not exist.')

    repo_id = workspace.repo_id
    repo = seafile_api.get_repo(repo_id)
    if not repo:
        return render_error(request, 'Library does not exist.')

    dtable = DTables.objects.get_dtable_by_uuid(dtable_id)
    if not dtable:
        return render_error(request, 'DTable does not exist.')

    asset_path = normalize_file_path(os.path.join('/asset', dtable_id, path))
    asset_id = seafile_api.get_file_id_by_path(repo_id, asset_path)
    if not asset_id:
        return render_error(request, 'Asset file does not exist.')

    # permission check
    username = request.user.username
    if not check_dtable_permission(username, workspace, dtable):
        return render_permission_error(request, _('Permission denied.'))

    file_enc = request.GET.get('file_enc', 'auto')
    if file_enc not in FILE_ENCODING_LIST:
        file_enc = 'auto'

    token = seafile_api.get_fileserver_access_token(
        repo_id, asset_id, 'view', '', use_onetime=False
    )

    file_name = os.path.basename(normalize_file_path(path))
    file_type, file_ext = get_file_type_and_ext(file_name)

    inner_path = gen_inner_file_get_url(token, file_name)
    error_msg, file_content, encoding = get_file_content(file_type, inner_path, file_enc)

    raw_path = gen_file_get_url(token, file_name)
    download_url = '%s/workspace/%s/asset/%s/%s?dl=1' % (DTABLE_WEB_SERVICE_URL.strip('/'), workspace_id, dtable_id, path)

    return_dict = {
        'repo': repo,
        'filename': file_name,
        'file_path': asset_path,
        'file_type': file_type,
        'file_ext': file_ext,
        'raw_path': raw_path,
        'download_url': download_url,
        'file_content': file_content,
        'err': 'File preview unsupported' if file_type == 'Unknown' else error_msg,
    }

    return render(request, 'dtable_asset_file_view_react.html', return_dict)


def dtable_form_view(request, token):

    # resource check
    form_obj = DTableForms.objects.get_form_by_token(token)
    if not form_obj:
        return render_error(request, 'Table\'s form does not exist.')

    workspace_id = form_obj.workspace_id
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        return render_error(request, 'Workspace does not exist.')

    dtable_uuid = form_obj.dtable_uuid
    dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
    if not dtable:
        return render_error(request, 'Table does not exist.')

    # permission check
    if not check_form_submit_permission(request, form_obj):
        return render_permission_error(request, _('Permission denied.'))

    # asset quota check
    if not check_user_workspace_quota(workspace):
        return render_error(request, _('Asset quota exceeded.'))

    # generate json web token
    payload = {
        'exp': int(time.time()) + 60 * 5,
        'dtable_uuid': dtable_uuid,
        'username': "form",
        'permission': PERMISSION_READ,
    }

    try:
        access_token = jwt.encode(
            payload, DTABLE_PRIVATE_KEY, algorithm='HS256'
        )
    except Exception as e:
        logger.error(e)
        return render_error(request, _('Internal Server Error'))

    url = '%s/api/v1/dtables/%s/metadata/' % (DTABLE_SERVER_URL.strip('/'), dtable_uuid)
    req = requests.Request(url, headers={"Authorization": "Token %s" % access_token.decode()})

    try:
        dtable_metadata = requests.urlopen(req).read().decode()
    except Exception as e:
        logger.error(e)
        return render_error(request, _('Internal Server Error'))

    return_dict = {
        'version': SEATABLE_VERSION,
        'dtable_metadata': dtable_metadata,
        'workspace_id': workspace_id,
        'form_id': form_obj.form_id,
        'form_config': form_obj.form_config,
        'dtable_name': dtable.name,
        'dtable_web_service_url': DTABLE_WEB_SERVICE_URL,
        'form_token': token,
    }

    return render(request, 'dtable_share_form_view_react.html', return_dict)


@login_required
def dtable_form_edit(request, token):
    """
    Permission:
    1. owner
    2. group member
    3. shared user with `rw` permission
    """

    # resource check
    form_obj = DTableForms.objects.get_form_by_token(token)
    if not form_obj:
        return render_error(request, 'Table\'s form does not exist.')

    workspace_id = form_obj.workspace_id
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        return render_error(request, 'Workspace does not exist.')

    dtable_uuid = form_obj.dtable_uuid
    dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
    if not dtable:
        return render_error(request, 'Table does not exist.')

    # permission check
    username = request.user.username
    permission = check_dtable_permission(username, workspace, dtable)
    if permission != PERMISSION_READ_WRITE:
        return render_permission_error(request, 'Permission denied.')

    if not check_user_workspace_quota(workspace):
        return render_error(request, 'Asset quota exceeded.')

    # generate json web token
    payload = {
        'exp': int(time.time()) + 60 * 5,
        'dtable_uuid': dtable_uuid,
        'username': "form",
        'permission': permission,
    }

    try:
        access_token = jwt.encode(
            payload, DTABLE_PRIVATE_KEY, algorithm='HS256'
        )
    except Exception as e:
        logger.error(e)
        return render_error(request, _('Internal Server Error'))

    url = '%s/api/v1/dtables/%s/metadata/' % (DTABLE_SERVER_URL.strip('/'), dtable_uuid)
    req = requests.Request(url, headers={"Authorization": "Token %s" % access_token.decode()})

    try:
        dtable_metadata = requests.urlopen(req).read().decode()
    except Exception as e:
        logger.error(e)
        return render_error(request, _('Internal Server Error'))

    share_type = form_obj.share_type
    shared_groups = list()
    if share_type == SHARED_GROUPS:
        group_ids =  DTableFormShare.objects.list_by_form(form_obj)
        shared_groups = [{'id': group_id, 'name': group_id_to_name(group_id)} 
                           for group_id in group_ids]

    return_dict = {
        'dtable_metadata': dtable_metadata,
        'dtable_name': dtable.name,
        'workspace_id': workspace_id,
        'form_id': form_obj.form_id,
        'form_config': form_obj.form_config,
        'dtable_uuid': dtable.uuid.hex,
        'dtable_web_service_url': DTABLE_WEB_SERVICE_URL,
        'form_token': token,
        'share_type': share_type,
        'shared_groups': json.dumps(shared_groups),
    }

    return render(request, 'dtable_edit_form_view_react.html', return_dict)


@login_required
def dtable_row_share_link_view(request, token):

    # resource check
    dtable_row_share = DTableRowShares.objects.get_dtable_row_share_by_token(token)
    if not dtable_row_share:
        return render_error(request, 'DTable row share link does not exist.')

    workspace_id = dtable_row_share.workspace_id
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        return render_error(request, 'Workspace does not exist.')

    repo_id = workspace.repo_id
    repo = seafile_api.get_repo(repo_id)
    if not repo:
        return render_error(request, 'Library does not exist.')

    dtable_uuid = dtable_row_share.dtable_uuid
    dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
    if not dtable:
        return render_error(request, 'DTable %s does not exist' % dtable_uuid)

    # generate json web token
    username = request.user.username
    payload = {
        'exp': int(time.time()) + 86400 * 3,
        'dtable_uuid': dtable.uuid.hex,
        'username': username,
        'permission': PERMISSION_READ,
    }

    try:
        access_token = jwt.encode(
            payload, DTABLE_PRIVATE_KEY, algorithm='HS256'
        )
    except Exception as e:
        logger.error(e)
        return render_error(request, _('Internal Server Error'))

    url_for_row = '%s/api/v1/dtables/%s/tables/%s/rows/%s/' % \
        (DTABLE_SERVER_URL.strip('/'), dtable_uuid, dtable_row_share.table_id, dtable_row_share.row_id)
    req_for_row = requests.Request(url_for_row, headers={"Authorization": "Token %s" % access_token.decode()})

    url_for_columns = '%s/api/v1/dtables/%s/tables/%s/columns/' % \
        (DTABLE_SERVER_URL.strip('/'), dtable_uuid, dtable_row_share.table_id)
    req_for_columns = requests.Request(url_for_columns, headers={"Authorization": "Token %s" % access_token.decode()})

    try:
        row_content = requests.urlopen(req_for_row).read().decode()
        columns = requests.urlopen(req_for_columns).read().decode()
    except Exception as e:
        logger.error(e)
        return render_error(request, _('Internal Server Error'))

    return_dict = {
        'row_content': row_content,
        'columns': columns,
        'workspace_id': workspace_id,
        'dtable_name': dtable.name
    }

    return render(request, 'dtable_shared_row_view_react.html', return_dict)


def dtable_share_link_view(request, token):
    dsl = DTableShareLinks.objects.filter(token=token).first()
    if not dsl:
        return render_error(request, _('Share link does not exist'))
    if dsl.is_expired():
        return render_error(request, _('Share link has expired'))

    shared_user = email2nickname(dsl.username)
    login_bg_image_path = get_login_bg_image_path()

    if isinstance(request.user, AnonymousUser):
        return render(request, 'dtable_share_react.html', {
            'shared_user': shared_user,
            'table_name': dsl.dtable.name,
            'next': '/dtable/links/%s' % dsl.token,
            'login_bg_image_path': login_bg_image_path,
            'powered_by_link': POWERED_BY_LINK
        })

    # resource check
    workspace_id = dsl.dtable.workspace.id
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        raise Http404

    name = dsl.dtable.name
    dtable = DTables.objects.get_dtable(workspace, name)
    if not dtable:
        return render_error(request, _('DTable does not exist'))

    current_username = request.user.username
    try:
        if current_username not in list_dtable_related_users(workspace, dtable):
            obj = DTableShare.objects.get_by_dtable_and_to_user(dtable, current_username)
            if not obj:
                DTableShare.objects.add(dtable, dsl.username, current_username, dsl.permission)
                share_dtable_to_user.send(sender=None,
                                          table_id=dtable.id,
                                          share_user=dsl.username,
                                          to_user=current_username)
    except Exception as e:
        logger.error('take user: %s to table: %s table-token: %s share-list error: %s',
                     current_username, dsl.dtable_id, token, e)
        return render_error(request, _('Internal Server Error.'))

    return HttpResponseRedirect(reverse('dtable:dtable_file_view', args=(workspace_id, name)))

@login_required
def dtable_snapshot_view(request, workspace_id, name, commit_id):
    """

    Permission:
    1. owner
    2. group member
    3. shared user
    """
    # resource check
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        return render_error(request, 'Workspace does not exist.')

    dtable = DTables.objects.get_dtable(workspace, name)
    if not dtable:
        return render_error(request, 'DTable does not exist.')

    # permission check
    username = request.user.username
    permission = check_dtable_permission(username, workspace, dtable)
    if not permission:
        return render_permission_error(request, _('Permission denied.'))

    snapshot = DTableSnapshot.objects.get_by_commit_id(commit_id)
    if not snapshot:
        return render_error(request, 'Snapshot does not exist.')

    return render(request, 'dtable_snapshot_view_react.html', {
        'version': SEATABLE_VERSION,
        'dtable_baidu_map_key': DTABLE_BAIDU_MAP_KEY,
        'dtable_google_map_key': DTABLE_GOOGLE_MAP_KEY,
        'seatable_market_url': SEATABLE_MARKET_URL,
        'file_name': dtable.name,
        'workspace_id': workspace.id,
        'dtable_uuid': dtable.uuid.hex,
        'media_url': MEDIA_URL,
        'dtable_server': DTABLE_SERVER_URL,
        'dtable_socket': DTABLE_SOCKET_URL,
        'permission': 'r',
        'snapshot_commit_id': commit_id,
    })


def dtable_form_asset(request, token, path):
    # argument check
    form_id = request.GET.get('token')
    if not form_id:
        return render_error(request, 'Permission denied.')

    # resource and permission check
    form = DTableForms.objects.get_form_by_token(token)
    if not form:
        return render_error(request, 'Table\'s form does not exist.')
    if form.form_id != form_id:
        return render_error(request, 'Permission denied.')

    workspace_id = form.workspace_id
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        return render_error(request, 'Workspace does not exist.')

    dtable_uuid = form.dtable_uuid
    dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
    if not dtable:
        return render_error(request, 'Table does not exist.')

    asset_name = os.path.basename(path.strip().rstrip('/'))
    asset_path = normalize_file_path(os.path.join('/asset', str(dtable.uuid), FORM_UPLOAD_IMG_RELATIVE_PATH, asset_name))
    asset_id = seafile_api.get_file_id_by_path(workspace.repo_id, asset_path)
    if not asset_id:
        return render_error(request, 'Asset file does not exist.')

    token = seafile_api.get_fileserver_access_token(
        workspace.repo_id, asset_id, 'view', '', use_onetime=False
    )

    url = gen_file_get_url(token, asset_name)

    return HttpResponseRedirect(url)


@login_required
@cache_control(max_age=settings.BROWSER_CACHE_MAX_AGE, public=True)
@conditional_browser_cache
def dtable_plugin_asset_view(request, workspace_id, name, plugin_id, path):
    """
    Permission:
    1. owner
    2. group member
    3. shared user
    """

    try:
        plugin_record = DTablePlugins.objects.get(pk=plugin_id)
    except DTablePlugins.DoesNotExist:
        error_msg = 'Plugin %s not found.' % plugin_id
        return render_error(request, error_msg)

    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        error_msg = 'Workspace %s not found.' % workspace_id
        return render_error(request, error_msg)

    if '@seafile_group' in workspace.owner:
        group_id = workspace.owner.split('@')[0]
        group = ccnet_api.get_group(int(group_id))
        if not group:
            error_msg = 'Group %s not found.' % group_id
            return render_error(request, error_msg)
    table_name = name
    dtable = DTables.objects.get_dtable(workspace, table_name)
    if not dtable:
        error_msg = 'DTable %s not found.' % table_name
        return render_error(request, error_msg)

    # permission check
    username = request.user.username
    permission = check_dtable_permission(username, workspace, dtable)
    if not permission:
        error_msg = 'Permission denied.'
        return render_error(request, error_msg)

    repo_id = workspace.repo_id
    repo = seafile_api.get_repo(repo_id)
    if not repo:
        error_msg = 'Library %s not found.' % repo_id
        return render_error(request, error_msg)

    plugin_file_path = os.path.join('/asset', str(dtable.uuid), 'plugins', plugin_record.name)
    asset_path = os.path.join(plugin_file_path, path)

    plugin_file_dir_id = seafile_api.get_file_id_by_path(repo_id, asset_path)
    if not plugin_file_dir_id:
        return render_error(request, 'Asset file does not exist.')

    token = seafile_api.get_fileserver_access_token(
        workspace.repo_id, plugin_file_dir_id, 'view', '', use_onetime=False
    )

    url = gen_file_get_url(token, asset_path)
    import requests
    r = requests.get(url)
    response = HttpResponse(r.content)

    content_type = mimetypes.guess_type(path)
    if type:
        response['Content-Type'] = content_type[0]

    return response


@cache_control(max_age=settings.BROWSER_CACHE_MAX_AGE, public=True)
@conditional_browser_cache
def dtable_external_link_plugin_asset_view(request, token, workspace_id, name, plugin_id, path):
    """
    used in external page
    """
    dtable_external_link = DTableExternalLinks.objects.filter(token=token).first()
    if not dtable_external_link:
        raise Http404

    try:
        plugin_record = DTablePlugins.objects.get(pk=plugin_id)
    except DTablePlugins.DoesNotExist:
        error_msg = 'Plugin %s not found.' % plugin_id
        return render_error(request, error_msg)

    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        error_msg = 'Workspace %s not found.' % workspace_id
        return render_error(request, error_msg)

    table_name = name
    dtable = DTables.objects.get_dtable(workspace, table_name)
    if not dtable:
        error_msg = 'DTable %s not found.' % table_name
        return render_error(request, error_msg)

    repo_id = workspace.repo_id
    repo = seafile_api.get_repo(repo_id)
    if not repo:
        error_msg = 'Library %s not found.' % repo_id
        return render_error(request, error_msg)

    plugin_file_path = os.path.join('/asset', str(dtable.uuid), 'plugins', plugin_record.name)
    asset_path = os.path.join(plugin_file_path, path)

    plugin_file_dir_id = seafile_api.get_file_id_by_path(repo_id, asset_path)
    if not plugin_file_dir_id:
        return render_error(request, 'Asset file does not exist.')

    token = seafile_api.get_fileserver_access_token(
        workspace.repo_id, plugin_file_dir_id, 'view', '', use_onetime=False
    )

    url = gen_file_get_url(token, asset_path)
    import requests
    r = requests.get(url)
    response = HttpResponse(r.content)

    content_type = mimetypes.guess_type(path)
    if type:
        response['Content-Type'] = content_type[0]

    return response


def dtable_external_link_view(request, token):
    dtable_external_link = DTableExternalLinks.objects.filter(token=token).first()
    if not dtable_external_link:
        raise Http404

    # resource check
    workspace_id = dtable_external_link.dtable.workspace.id
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        raise Http404

    name = dtable_external_link.dtable.name
    dtable = DTables.objects.get_dtable(workspace, name)
    if not dtable:
        return render_error(request, _('DTable does not exist'))

    try:
        DTableExternalLinks.objects.filter(token=token).update(view_cnt=F('view_cnt')+1)
    except Exception as e:
        logger.error('update external link view_cnt error: %s', e)

    request.session['external_link'] = {'token': token, 'dtable_uuid': dtable.uuid.hex}

    return render(request, 'dtable_external_link_view_react.html', {
        'version': SEATABLE_VERSION,
        'dtable_baidu_map_key': DTABLE_BAIDU_MAP_KEY,
        'dtable_google_map_key': DTABLE_GOOGLE_MAP_KEY,
        'media_url': MEDIA_URL,
        'dtable_server': DTABLE_SERVER_URL,
        'dtable_socket': DTABLE_SOCKET_URL,
        'workspace_id': workspace.id,
        'file_name': dtable.name,
        'dtable_uuid': dtable.uuid.hex,
        'permission': 'r',
        'external_link_token': token
    })


def dtable_external_download_link_view(request, token):

    dtable_external_link = DTableExternalLinks.objects.filter(token=token).first()
    if not dtable_external_link:
        raise Http404

    # resource check
    workspace_id = dtable_external_link.dtable.workspace.id
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        raise Http404

    name = dtable_external_link.dtable.name
    dtable = DTables.objects.get_dtable(workspace, name)
    if not dtable:
        return render_error(request, _('DTable does not exist'))

    repo_id = workspace.repo_id
    repo = seafile_api.get_repo(repo_id)
    if not repo:
        error_msg = 'Library %s not found.' % repo_id
        return render_error(request, error_msg)

    # get dtable_file_dir_id and asset_dir_id
    dtable_file_dir_id = seafile_api.get_file_id_by_path(repo_id, '/' + name + '.dtable/')
    if not dtable_file_dir_id:
        error_msg = 'DTable %s not found.' % name
        return render_error(request, error_msg)

    params = {}
    params['username'] = 'anonymous_user'
    params['table_name'] = name
    params['repo_id'] = repo_id
    params['dtable_uuid'] = str(dtable.uuid)

    try:
        task_id = add_dtable_io_task(type='export', params=params)
    except Exception as e:
        return render_error(request, 'Server is busy. Please try again later.')

    finished = False
    while not finished:
        resp = query_dtable_io_status(task_id)

        finished = json.loads(resp.content)['is_finished']
        time.sleep(1)

    tmp_zip_path = os.path.join('/tmp/dtable-io', str(dtable.uuid), 'zip_file') + '.zip'
    if not os.path.exists(tmp_zip_path):
        return render_error(request, _('Internal Server Error'))

    with open(tmp_zip_path, 'rb') as f:
        zip_stream = f.read()
    os.remove(tmp_zip_path)

    response = HttpResponse(zip_stream, content_type="application/x-zip-compressed")
    response['Content-Disposition'] = 'attachment;filename*=UTF-8\'\'' + urlquote(dtable.dtable_name) + '.dtable'
    return response
