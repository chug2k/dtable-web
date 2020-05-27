# -*- coding: utf-8 -*-

import logging

from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from seaserv import seafile_api, ccnet_api

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error, get_user_common_info
from seahub.dtable.models import Workspaces, DTables, DTableSnapshot
from seahub.dtable.utils import check_dtable_permission, is_valid_jwt
from seahub.utils import normalize_file_path, gen_file_get_url
from seahub.utils.timeutils import timestamp_to_isoformat_timestr
from seahub.api2.endpoints.dtable import FILE_TYPE
from seahub.settings import FILESERVER_TOKEN_ONCE_ONLY

logger = logging.getLogger(__name__)


class DTableLatestCommitIdView(APIView):

    throttle_classes = (UserRateThrottle,)

    def get(self, request):
        """get dtable latest commit id
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

        try:
            current_commit = seafile_api.get_commit_list(repo_id, 0, 1)[0]
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'latest_commit_id': current_commit.id})


class DTableSnapshotsView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, workspace_id, name):
        """List dtable snapshots
        """
        # argument check
        table_name = name
        table_file_name = table_name + FILE_TYPE

        try:
            current_page = int(request.GET.get('page', '1'))
            per_page = int(request.GET.get('per_page', '50'))
        except ValueError:
            current_page = 1
            per_page = 20

        start = per_page * (current_page - 1)

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        if '@seafile_group' in workspace.owner:
            group_id = workspace.owner.split('@')[0]
            group = ccnet_api.get_group(int(group_id))
            if not group:
                error_msg = 'Group %s not found.' % group_id
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'dtable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        if not check_dtable_permission(username, workspace, dtable):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # main
        snapshot_list = list()
        try:
            dtable_uuid = str(dtable.uuid.hex)
            snapshot_queryset = DTableSnapshot.objects.list_by_dtable_uuid(
                dtable_uuid)
            count = snapshot_queryset.count()

            for snapshot in snapshot_queryset[start:start + per_page]:
                data = {
                    'dtable_name': snapshot.dtable_name,
                    'commit_id': snapshot.commit_id,
                    'ctime': timestamp_to_isoformat_timestr(snapshot.ctime // 1000),
                }
                snapshot_list.append(data)
        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        has_next_page = True if count > start + per_page else False
        page_info = {
            'has_next_page': has_next_page,
            'current_page': current_page
        }

        return Response({'snapshot_list': snapshot_list, "page_info": page_info})


class DTableSnapshotView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, workspace_id, name, commit_id):
        """Get dtable snapshot by commit_id
        """
        table_name = name
        table_file_name = table_name + FILE_TYPE

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        if '@seafile_group' in workspace.owner:
            group_id = workspace.owner.split('@')[0]
            group = ccnet_api.get_group(int(group_id))
            if not group:
                error_msg = 'Group %s not found.' % group_id
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

        # check for get download link
        table_path = normalize_file_path(table_file_name)
        table_file_id = seafile_api.get_file_id_by_path(repo_id, table_path)
        if not table_file_id:
            error_msg = 'file %s not found.' % table_file_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        if not check_dtable_permission(username, workspace, dtable):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # main
        try:
            snapshot = DTableSnapshot.objects.get_by_commit_id(commit_id)

            # check
            if not snapshot:
                error_msg = 'commit_id not found.'
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)

            dtable_uuid = str(dtable.uuid.hex)
            if dtable_uuid != snapshot.dtable_uuid:
                error_msg = 'commit_id invalid.'
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)

            # get by commit
            snapshot_table_path = normalize_file_path(snapshot.dtable_name)
            obj_id = seafile_api.get_file_id_by_commit_and_path(
                repo_id, commit_id, snapshot_table_path)
            if not obj_id:
                return api_error(status.HTTP_404_NOT_FOUND, 'snapshot not found.')

        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        # download url
        token = seafile_api.get_fileserver_access_token(
            repo_id, obj_id, 'download', username, FILESERVER_TOKEN_ONCE_ONLY)

        if not token:
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        redirect_url = gen_file_get_url(token, snapshot.dtable_name)
        return Response(redirect_url)
