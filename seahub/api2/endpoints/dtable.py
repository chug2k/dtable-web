# -*- coding: utf-8 -*-

import os
import json
import logging
import time
import jwt
from io import BytesIO
from datetime import datetime

import requests
from PIL import Image
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from django.utils.translation import ugettext as _

from pysearpc import SearpcError
from seaserv import seafile_api, ccnet_api

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.status import HTTP_443_ABOVE_QUOTA
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error, get_user_common_info
from seahub.dtable.models import Workspaces, DTables, DTableRowShares, UserStarredDTables
from seahub.base.templatetags.seahub_tags import email2nickname
from seahub.group.utils import group_id_to_name
from seahub.utils import is_valid_dirent_name, is_org_context, normalize_file_path, \
     check_filename_with_rename, gen_file_upload_url, get_fileserver_root, gen_file_get_url, \
     DTABLE_EVENTS_ENABLED, events_redis_connection, get_file_type_and_ext, file_types
from seahub.settings import MAX_UPLOAD_FILE_NAME_LEN, DTABLE_PRIVATE_KEY, DTABLE_SERVER_URL, DTABLE_SOCKET_URL
from seahub.dtable.utils import create_repo_and_workspace, check_dtable_permission, is_valid_jwt, \
    list_dtable_related_users, UPLOAD_IMG_RELATIVE_PATH, UPLOAD_FILE_RELATIVE_PATH, convert_dtable_trash_names, \
    check_dtable_admin_permission, check_user_workspace_quota
from seahub.constants import PERMISSION_ADMIN, PERMISSION_READ_WRITE
from seahub.thumbnail.utils import remove_thumbnail_by_id


logger = logging.getLogger(__name__)


FILE_TYPE = '.dtable'
WRITE_PERMISSION_TUPLE = (PERMISSION_READ_WRITE, PERMISSION_ADMIN)


class WorkspacesView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        """get all workspaces
        """
        username = request.user.username

        org_id = -1
        if is_org_context(request):
            org_id = request.user.org.org_id

        if org_id and org_id > 0:
            groups = ccnet_api.get_org_groups_by_user(org_id, username)
        else:
            groups = ccnet_api.get_groups(username, return_ancestors=True)

        owner_list = list()
        owner_list.append(username)
        for group in groups:
            group_user = '%s@seafile_group' % group.id
            owner_list.append(group_user)

        try:
            # workspaces
            workspace_queryset = Workspaces.objects.filter(owner__in=owner_list)
            workspaces = list(workspace_queryset)
            # user workspace
            if not workspace_queryset.filter(owner=username).exists():
                workspace = create_repo_and_workspace(username, org_id)
                workspaces.append(workspace)
            # dtables
            table_queryset = DTables.objects.filter(workspace__in=workspaces, deleted=False)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        try:
            starred_dtable_uuids = set(UserStarredDTables.objects.get_dtable_uuids_by_email(username))
        except Exception as e:
            starred_dtable_uuids = set()
            logger.warning(e)

        workspace_list = list()
        for workspace in workspaces:
            # resource check
            repo_id = workspace.repo_id
            repo = seafile_api.get_repo(repo_id)
            if not repo:
                logger.warning('Library %s not found.' % repo_id)
                continue

            res = workspace.to_dict()

            tables = table_queryset.filter(workspace=workspace)
            res["table_list"] = [table.to_dict() for table in tables]
            for t in res['table_list']:
                t['starred'] = t['uuid'].hex in starred_dtable_uuids

            owner = workspace.owner
            if '@seafile_group' in owner:
                group_id = owner.split('@')[0]
                group_members = ccnet_api.get_group_members(int(group_id))
                group_admins = [m.user_name for m in group_members if m.is_staff]
                group_owner = [g.creator_name for g in groups if g.id == int(group_id)][0]

                res["owner_name"] = group_id_to_name(group_id)
                res["owner_type"] = "Group"
                res["group_id"] = group_id
                res["group_owner"] = group_owner
                res["group_admins"] = group_admins
            else:
                res["owner_name"] = email2nickname(owner)
                res["owner_type"] = "Personal"

            workspace_list.append(res)

        if DTABLE_EVENTS_ENABLED:
            timestamp = datetime.utcnow().strftime('%Y-%m-%d 00:00:00')
            message = {
                'username': username, 'timestamp': timestamp, 'org_id': org_id
            }

            try:
                events_redis_connection.publish('user-activity-statistic', json.dumps(message))
            except Exception as e:
                logger.error("Failed to publish message: %s " % e)

        return Response({"workspace_list": workspace_list}, status=status.HTTP_200_OK)


class DTablesView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def post(self, request):
        """create a table file

        Permission:
        1. owner
        2. group admin
        """
        # role permission check
        if not request.user.permissions.can_add_dtable():
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # argument check
        table_owner = request.POST.get('owner')
        if not table_owner:
            error_msg = 'owner invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_name = request.POST.get('name')
        if not table_name:
            error_msg = 'name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_file_name = table_name + FILE_TYPE
        if not is_valid_dirent_name(table_file_name):
            error_msg = 'name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        workspace = Workspaces.objects.get_workspace_by_owner(table_owner)
        if not workspace:
            org_id = -1
            if is_org_context(request):
                org_id = request.user.org.org_id

            try:
                workspace = create_repo_and_workspace(table_owner, org_id)
            except Exception as e:
                logger.error(e)
                error_msg = 'Internal Server Error.'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        existed_dtables = DTables.objects.filter(workspace=workspace, name=table_name)
        if len(existed_dtables) > 0:
            error_msg = _('Table %s already exists in this workspace.') % table_name
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        if not check_dtable_admin_permission(username, workspace.owner):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # repo status check
        repo_status = repo.status
        if repo_status != 0:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # create new empty table
        table_file_name = check_filename_with_rename(repo_id, '/', table_file_name)

        try:
            seafile_api.post_empty_file(repo_id, '/', table_file_name, username)
        except SearpcError as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        try:
            dtable = DTables.objects.create_dtable(username, workspace, table_name)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({"table": dtable.to_dict()}, status=status.HTTP_201_CREATED)


class DTableView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def put(self, request, workspace_id):
        """rename a table

        Permission:
        1. owner
        2. group adminn
        """
        # argument check
        old_table_name = request.data.get('old_name')
        if not old_table_name:
            error_msg = 'old_name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        new_table_name = request.data.get('new_name')
        if not new_table_name:
            error_msg = 'new_name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        new_table_file_name = new_table_name + FILE_TYPE
        if not is_valid_dirent_name(new_table_file_name):
            error_msg = 'new_name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if len(new_table_file_name) > MAX_UPLOAD_FILE_NAME_LEN:
            error_msg = 'new_name is too long.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, old_table_name)
        if not dtable:
            error_msg = 'dtable %s not found.' % old_table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        old_table_file_name = old_table_name + FILE_TYPE
        old_table_path = normalize_file_path(old_table_file_name)
        table_file_id = seafile_api.get_file_id_by_path(repo_id, old_table_path)
        if not table_file_id:
            error_msg = 'file %s not found.' % old_table_file_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        if not check_dtable_admin_permission(username, workspace.owner):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # repo status check
        repo_status = repo.status
        if repo_status != 0:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # rename table
        new_table_file_name = check_filename_with_rename(repo_id, '/', new_table_file_name)
        try:
            seafile_api.rename_file(repo_id, '/', old_table_file_name, new_table_file_name, username)
        except SearpcError as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        try:
            dtable.name = new_table_name
            dtable.modifier = username
            dtable.save()
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({"table": dtable.to_dict()}, status=status.HTTP_200_OK)

    def delete(self, request, workspace_id):
        """delete a table

        Permission:
        1. owner
        2. group admin
        """
        # argument check
        table_name = request.data.get('name')
        if not table_name:
            error_msg = 'name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        table_file_name = table_name + FILE_TYPE

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'dtable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        if not check_dtable_admin_permission(username, workspace.owner):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # repo status check
        repo_status = repo.status
        if repo_status != 0:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # rename .dtable file
        new_dtable_name, old_dtable_file_name, new_dtable_file_name = convert_dtable_trash_names(dtable)

        table_path = normalize_file_path(table_file_name)
        table_file_id = seafile_api.get_file_id_by_path(repo_id, table_path)
        # if has .dtable file, then rename, else skip
        if table_file_id:
            seafile_api.rename_file(repo_id, '/', old_dtable_file_name, new_dtable_file_name, username)

        try:
            DTables.objects.filter(id=dtable.id).update(deleted=True,
                                                        delete_time=datetime.utcnow(),
                                                        name=new_dtable_name)
        except Exception as e:
            logger.error('delete dtable: %s error: %s', dtable.id, e)

        return Response({'success': True}, status=status.HTTP_200_OK)


class DTableAssetUploadLinkView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, workspace_id):
        """get table file upload link

        Permission:
        1. owner
        2. group member
        3. shared user with `rw` or `admin` permission
        """
        # argument check
        table_name = request.GET.get('name', None)
        if not table_name:
            error_msg = 'name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'dtable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        if check_dtable_permission(username, workspace, dtable) not in WRITE_PERMISSION_TUPLE:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # quota check
        if not check_user_workspace_quota(workspace):
            error_msg = 'Asset quota exceeded.'
            return api_error(HTTP_443_ABOVE_QUOTA, error_msg)

        # create asset dir
        asset_dir_path = os.path.join('/asset', str(dtable.uuid))
        asset_dir_id = seafile_api.get_dir_id_by_path(repo_id, asset_dir_path)
        if not asset_dir_id:
            seafile_api.mkdir_with_parents(repo_id, '/', asset_dir_path[1:], username)

        # get token
        obj_id = json.dumps({'parent_dir': asset_dir_path})
        try:
            token = seafile_api.get_fileserver_access_token(repo_id, obj_id, 'upload',
                                                            '', use_onetime=False)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        upload_link = gen_file_upload_url(token, 'upload-api')

        dtable.modifier = username
        dtable.save()

        res = dict()
        res['upload_link'] = upload_link
        res['parent_path'] = asset_dir_path
        res['img_relative_path'] = os.path.join(UPLOAD_IMG_RELATIVE_PATH, str(datetime.today())[:7])
        res['file_relative_path'] = os.path.join(UPLOAD_FILE_RELATIVE_PATH, str(datetime.today())[:7])
        return Response(res)


class DTableUpdateLinkView(APIView):

    throttle_classes = (UserRateThrottle,)

    def get(self, request):
        """get table file update link
        Permission:
        1. use dtable_uuid verify jwt from dtable-server
        """
        # argument check
        dtable_uuid = request.GET.get('dtable_uuid', None)
        if not dtable_uuid:
            error_msg = 'dtable_uuid invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # permission check
        auth = request.META.get('HTTP_AUTHORIZATION', '').split()
        if not is_valid_jwt(auth, dtable_uuid):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # resource check
        dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
        if not dtable:
            error_msg = 'dtable %s not found.' % dtable_uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace.id)
        if not workspace:
            error_msg = 'Workspace not found.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        username = request.user.username
        # get token
        obj_id = json.dumps({'parent_dir': '/'})
        try:
            token = seafile_api.get_fileserver_access_token(repo_id, obj_id, 'upload',
                                                            username, use_onetime=False)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        update_link = '%s/%s/%s' % (get_fileserver_root(), 'upload-api', token)

        res = dict()
        res['update_link'] = update_link
        res['file_name'] = dtable.name + FILE_TYPE

        return Response(res)


class DTableDownloadLinkView(APIView):

    throttle_classes = (UserRateThrottle,)

    def get(self, request):
        """get table file download link
        Permission:
        1. use dtable_uuid verify jwt from dtable-server
        """
        # argument check
        dtable_uuid = request.GET.get('dtable_uuid', None)
        if not dtable_uuid:
            error_msg = 'dtable_uuid invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # permission check
        auth = request.META.get('HTTP_AUTHORIZATION', '').split()
        if not is_valid_jwt(auth, dtable_uuid):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # resource check
        dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
        if not dtable:
            error_msg = 'dtable %s not found.' % dtable_uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        table_name = dtable.name

        workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace.id)
        if not workspace:
            error_msg = 'Workspace not found.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        username = request.user.username
        table_file_name = table_name + FILE_TYPE
        try:
            file_path = '/' + table_file_name
            file_id = seafile_api.get_file_id_by_path(repo_id, file_path)
            token = seafile_api.get_fileserver_access_token(repo_id, file_id, 'download',
                                                            username, use_onetime=False)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        download_link = gen_file_get_url(token, table_name)

        return Response({'download_link': download_link})


class DTableAccessTokenView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, workspace_id, name):
        """get dtable access token
        """

        table_name = name

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'dtable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        permission = check_dtable_permission(username, workspace, dtable)
        if not permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # generate json web token
        payload = {
            'exp': int(time.time()) + 86400 * 3,
            'dtable_uuid': dtable.uuid.hex,
            'username': username,
            'permission': permission if check_user_workspace_quota(dtable.workspace) else 'r',
        }

        try:
            access_token = jwt.encode(
                payload, DTABLE_PRIVATE_KEY, algorithm='HS256'
            )
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({
            'access_token': access_token,
            'dtable_uuid': dtable.uuid.hex,
            'dtable_server': DTABLE_SERVER_URL,
            'dtable_socket': DTABLE_SOCKET_URL,
        })


class DTableRowSharesView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        """get a dtable row share link
        Permission:
        1. owner
        2. group member
        3. shared user with `rw` or `admin` permission
        """
        # argument check
        workspace_id = request.GET.get('workspace_id', None)
        if not workspace_id:
            error_msg = 'workspace_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_name = request.GET.get('name', None)
        if not table_name:
            error_msg = 'name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_id = request.GET.get('table_id', None)
        if not table_id:
            error_msg = 'table_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        row_id = request.GET.get('row_id', None)
        if not row_id:
            error_msg = 'row_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'DTable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        if check_dtable_permission(username, workspace, dtable) not in WRITE_PERMISSION_TUPLE:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        dtable_uuid = dtable.uuid.hex
        try:
            row_share = DTableRowShares.objects.get_dtable_row_share(
                username, workspace_id, dtable_uuid, table_id, row_id
            )
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({"row_share": row_share}, status=status.HTTP_200_OK)

    def post(self, request):
        """create a dtable row share link
        Permission:
        1. owner
        2. group member
        3. shared user with `rw` or `admin` permission
        """
        # argument check
        workspace_id = request.POST.get('workspace_id')
        if not workspace_id:
            error_msg = 'workspace_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_name = request.POST.get('name')
        if not table_name:
            error_msg = 'name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_id = request.POST.get('table_id')
        if not table_id:
            error_msg = 'table_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        row_id = request.POST.get('row_id')
        if not row_id:
            error_msg = 'row_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'DTable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        if check_dtable_permission(username, workspace, dtable) not in WRITE_PERMISSION_TUPLE:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        dtable_uuid = dtable.uuid.hex
        row_share = DTableRowShares.objects.get_dtable_row_share(
            username, workspace_id, dtable_uuid, table_id, row_id
        )
        if row_share:
            error_msg = 'Row share link %s already exists.' % row_share['token']
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        try:
            row_share = DTableRowShares.objects.add_dtable_row_share(
                username, workspace_id, dtable_uuid, table_id, row_id
            )
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({"row_share": row_share}, status=status.HTTP_201_CREATED)


class DTableRowShareView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def delete(self, request, token):
        """ Delete share link.
        Permission:
        1. dtable row share owner;
        """
        # resource check
        row_share = DTableRowShares.objects.get_dtable_row_share_by_token(token)
        if not row_share:
            return Response({'success': True}, status=status.HTTP_200_OK)

        # permission check
        username = request.user.username
        row_share_owner = row_share.username
        if username != row_share_owner:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        try:
            DTableRowShares.objects.delete_dtable_row_share(token)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True}, status=status.HTTP_200_OK)


class InternalDTableRelatedUsersView(APIView):
    throttle_classes = (UserRateThrottle,)

    def get(self, request):
        dtable_uuid = request.GET.get('dtable_uuid')
        # permission check
        auth = request.META.get('HTTP_AUTHORIZATION', '').split()
        if not is_valid_jwt(auth, dtable_uuid):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)
        # resource check
        dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
        if not dtable:
            error_msg = 'dtable %s not found.' % dtable_uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace.id)
        if not workspace:
            error_msg = 'Workspace not found.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        user_list = []
        try:
            email_list = list_dtable_related_users(workspace, dtable)

            for email in email_list:
                user_info = get_user_common_info(email)
                user_list.append(user_info)
        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        return Response({'user_list': user_list})


class DTableImageRotateView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def post(self, request, workspace_id, name):
        # arguments check
        path = request.data.get('path')
        if not path:
            error_msg = 'path is invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        angle = request.data.get('angle')
        if not angle or angle not in ('90', '180', '270'):
            error_msg = 'angle is invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        angle = {'90': 2, '180': 3, '270': 4}[angle]

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % (workspace_id,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable = DTables.objects.get_dtable(workspace, name)
        if not dtable:
            error_msg = 'Table %s not found.' % (name,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        parent_dir = os.path.join('/asset', str(dtable.uuid))
        asset_path = os.path.join(parent_dir, path.lstrip('/'))
        asset_id = seafile_api.get_file_id_by_path(workspace.repo_id, asset_path)
        if not asset_id:
            error_msg = 'Picture %s not found.' % (path,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        asset_name = os.path.basename(path)
        file_type, _ = get_file_type_and_ext(asset_name)
        if file_type != file_types.IMAGE:
            error_msg = '%s is not a picture.' % (path,)
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # permission check
        user = request.user
        if check_dtable_permission(user.username, workspace, dtable) != PERMISSION_READ_WRITE:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # get token
        try:
            token = seafile_api.get_fileserver_access_token(
                workspace.repo_id, asset_id, 'view', '', use_onetime=False
            )
        except Exception as e:
            logger.error('get view token error: %s', e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        asset_url = gen_file_get_url(token, asset_name)

        # request pic
        try:
            response = requests.get(asset_url)
            if response.status_code != 200:
                logger.error('request asset url: %s response code: %s', asset_url, response.status_code)
                error_msg = 'Internal Server Error.'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        except Exception as e:
            logger.error('request: %s error: %s', asset_url, e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        img = response.content

        # get upload link
        old_img = Image.open(BytesIO(img))
        obj_id = json.dumps({'parent_dir': parent_dir})
        try:
            token = seafile_api.get_fileserver_access_token(workspace.repo_id, obj_id, 'upload',
                                                            '', use_onetime=False)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        upload_link = gen_file_upload_url(token, 'upload-api')

        # upload
        try:
            # rotate and save to fp
            fp = BytesIO()
            content_type = response.headers['Content-Type']
            old_img.transpose(angle).save(fp, content_type.split('/')[1])
            response = requests.post(upload_link, data={'parent_dir': parent_dir, 'relative_path': os.path.dirname(path.strip('/')), 'replace': 1}, files={
                'file': (asset_name, fp.getvalue(), content_type)
            })
            if response.status_code != 200:
                logger.error('upload: %s status code: %s', upload_link, response.status_code)
                error_msg = 'Internal Server Error.'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        except Exception as e:
            logger.error('upload rotated image error: %s', e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # remove thumbnails
        remove_thumbnail_by_id(asset_id)

        return Response({'success': True})
