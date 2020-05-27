import os
import logging
import stat

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.constants import PERMISSION_READ_WRITE
from seahub.dtable.models import DTables, Workspaces
from seahub.dtable.utils import check_dtable_permission
from seahub.utils.timeutils import timestamp_to_isoformat_timestr

from seaserv import seafile_api


logger = logging.getLogger(__name__)


def get_dirent_info(dirent):

    if stat.S_ISDIR(dirent.mode):
        is_file = False
    else:
        is_file = True

    result = {}
    result['is_file'] = is_file
    result['obj_name'] = dirent.obj_name
    result['file_size'] = dirent.size if is_file else ''
    result['last_update'] = timestamp_to_isoformat_timestr(dirent.mtime)

    return result


def _get_dir_list_by_path(repo_id, parent_dir):
    dirs = seafile_api.list_dir_by_path(repo_id, parent_dir)
    return [get_dirent_info(dir) for dir in dirs if '.dtable' not in dir.obj_name]


class DTableStorageView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, dtable_uuid):
        base_dir = '/asset/' + dtable_uuid
        # resource check
        dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
        if not dtable or dtable.deleted:
            error_msg = 'Table %s not found.' % (dtable_uuid,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        # permission check
        username = request.user.username
        if not check_dtable_permission(username, dtable.workspace):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        repo_id = dtable.workspace.repo_id
        repo_owner = dtable.workspace.owner
        parent_dir = request.GET.get('parent_dir')

        if not parent_dir or parent_dir == '/':
            parent_dir = base_dir
            parent_dir_id = seafile_api.get_dir_id_by_path(repo_id, parent_dir)
            if not parent_dir_id:
                return Response({'dirent_list': []})
            dirent_list = _get_dir_list_by_path(repo_id, parent_dir)
            return Response({'dirent_list': dirent_list})

        parent_dir = base_dir + parent_dir
        parent_dir_id = seafile_api.get_dir_id_by_path(repo_id, parent_dir)
        if not parent_dir_id:
            error_msg = 'parent_dir is invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        dirent_list = _get_dir_list_by_path(repo_id, parent_dir)
        return Response({'dirent_list': dirent_list})

    def delete(self, request, dtable_uuid):
        # argument check
        parent_path = request.GET.get('parent_path', '')
        if not parent_path:
            error_msg = 'parent_path is invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        parent_path = parent_path.lstrip('/')
        name = request.GET.get('name', '').lstrip('/')
        if not name:
            error_msg = 'name is invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # dtable check
        dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
        if not dtable:
            error_msg = 'Table %s not found.' % (dtable_uuid,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        # permission check
        username = request.user.username
        if check_dtable_permission(username, dtable.workspace) != PERMISSION_READ_WRITE:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)
        # delete resource
        parent_path = os.path.join('/asset', dtable_uuid, parent_path)
        try:
            seafile_api.del_file(dtable.workspace.repo_id, parent_path, name, username)
        except Exception as e:
            logger.error('del parent_path: %s, name: %s, error: %s', parent_path, name, e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True})

class DTableAssetExistsView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, workspace_id, name):
        """
        check wether an asset exists by path
        """

        table_name = name

        path = request.query_params.get('path', '').lstrip('/')
        if not path:
            error_msg = 'path invalid.'
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

        asset_path = os.path.join('/asset', str(dtable.uuid), path)
        try:
            dir = seafile_api.get_dirent_by_path(repo_id, asset_path)
        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        res = {}
        res['is_exist'] = True if dir else False
        return Response(res)
