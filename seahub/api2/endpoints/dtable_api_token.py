import json
import logging
import time
import jwt
import os

import requests
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from django.utils.translation import ugettext as _

from seaserv import seafile_api

from seahub.utils import gen_file_upload_url, gen_file_get_url, gen_dir_zip_download_url
from seahub.utils.timeutils import datetime_to_isoformat_timestr
from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle, AnonRateThrottle
from seahub.api2.utils import api_error
from seahub.api2.status import HTTP_443_ABOVE_QUOTA
from seahub.dtable.models import Workspaces, DTables, DTableAPIToken
from seahub.settings import DTABLE_PRIVATE_KEY, DTABLE_SERVER_URL, DTABLE_SOCKET_URL
from seahub.dtable.utils import check_dtable_admin_permission, check_dtable_permission, check_user_workspace_quota
from seahub.constants import PERMISSION_READ, PERMISSION_READ_WRITE

logger = logging.getLogger(__name__)
API_TOKEN_PERMISSION_TUPLE = (PERMISSION_READ, PERMISSION_READ_WRITE)


def _resource_check(workspace_id, table_name):
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        error_msg = 'Workspace %s not found.' % workspace_id
        return api_error(status.HTTP_404_NOT_FOUND, error_msg), None, None

    repo_id = workspace.repo_id
    repo = seafile_api.get_repo(repo_id)
    if not repo:
        error_msg = 'Library %s not found.' % repo_id
        return api_error(status.HTTP_404_NOT_FOUND, error_msg), None, None

    dtable = DTables.objects.get_dtable(workspace, table_name)
    if not dtable:
        error_msg = 'dtable %s not found.' % table_name
        return api_error(status.HTTP_404_NOT_FOUND, error_msg), None, None

    return None, workspace, dtable


def _permission_check_for_api_token(username, owner):
    # only owner or group admin
    if not check_dtable_admin_permission(username, owner):
        error_msg = _('Permission denied.')
        return api_error(status.HTTP_403_FORBIDDEN, error_msg)

    return None


def _api_token_obj_to_dict(api_token_obj):
    return {
        'app_name': api_token_obj.app_name,
        'api_token': api_token_obj.token,
        'generated_by': api_token_obj.generated_by,
        'generated_at': datetime_to_isoformat_timestr(api_token_obj.generated_at),
        'last_access': datetime_to_isoformat_timestr(api_token_obj.last_access),
        'permission': api_token_obj.permission,
    }


class DTableAPITokensView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, workspace_id, name):
        """list dtable api token for thirdpart app
        """
        table_name = name
        username = request.user.username

        # resource check
        error, workspace, dtable = _resource_check(workspace_id, table_name)
        if error:
            return error

        # permission check
        owner = workspace.owner
        error = _permission_check_for_api_token(username, owner)
        if error:
            return error

        # main
        api_tokens = list()

        try:
            api_token_queryset = DTableAPIToken.objects.list_by_dtable(dtable)
            for api_token_obj in api_token_queryset:
                data = _api_token_obj_to_dict(api_token_obj)
                api_tokens.append(data)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'api_tokens': api_tokens})

    def post(self, request, workspace_id, name):
        """generate dtable api token
        """
        table_name = name
        username = request.user.username

        # argument check
        app_name = request.data.get('app_name')
        if not app_name:
            return api_error(status.HTTP_400_BAD_REQUEST, 'app_name invalid.')

        permission = request.data.get('permission')
        if not permission or permission not in API_TOKEN_PERMISSION_TUPLE:
            error_msg = 'permission invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        error, workspace, dtable = _resource_check(workspace_id, table_name)
        if error:
            return error

        # permission check
        owner = workspace.owner
        error = _permission_check_for_api_token(username, owner)
        if error:
            return error

        # main
        try:
            exist_obj = DTableAPIToken.objects.get_by_dtable_and_app_name(dtable, app_name)
            if exist_obj is not None:
                return api_error(status.HTTP_400_BAD_REQUEST, 'api token already exist.')

            api_token_obj = DTableAPIToken.objects.add(dtable, app_name, username, permission)

            data = _api_token_obj_to_dict(api_token_obj)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response(data, status=status.HTTP_201_CREATED)


class DTableAPITokenView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def delete(self, request, workspace_id, name, app_name):
        """delete dtable api token
        """
        table_name = name
        username = request.user.username

        # resource check
        error, workspace, dtable = _resource_check(workspace_id, table_name)
        if error:
            return error

        # permission check
        owner = workspace.owner
        error = _permission_check_for_api_token(username, owner)
        if error:
            return error

        # main
        try:
            api_token_obj = DTableAPIToken.objects.get_by_dtable_and_app_name(dtable, app_name)
            if api_token_obj is None:
                return api_error(status.HTTP_404_NOT_FOUND, 'api token not found.')

            api_token_obj.delete()
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True})

    def put(self, request, workspace_id, name, app_name):
        """update dtable api token
        """
        table_name = name
        username = request.user.username

        # argument check
        permission = request.data.get('permission')
        if not permission or permission not in API_TOKEN_PERMISSION_TUPLE:
            error_msg = 'permission invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        error, workspace, dtable = _resource_check(workspace_id, table_name)
        if error:
            return error

        # permission check
        owner = workspace.owner
        error = _permission_check_for_api_token(username, owner)
        if error:
            return error

        # main
        try:
            api_token_obj = DTableAPIToken.objects.get_by_dtable_and_app_name(dtable, app_name)
            if api_token_obj is None:
                return api_error(status.HTTP_404_NOT_FOUND, 'api token not found.')

            if permission == api_token_obj.permission:
                return api_error(status.HTTP_400_BAD_REQUEST, 'api token already has %s permission.' % permission)

            api_token_obj.permission = permission
            api_token_obj.save(update_fields=['permission'])

            data = _api_token_obj_to_dict(api_token_obj)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response(data)


class DTableAppAccessTokenView(APIView):
    throttle_classes = (AnonRateThrottle,)

    def get(self, request):
        """thirdpart app used dtable api token to get access token and dtable uuid
        """
        # argument check
        token_list = request.META.get('HTTP_AUTHORIZATION', '').split()
        if not token_list or token_list[0].lower() != 'token' or len(token_list) != 2:
            return api_error(status.HTTP_403_FORBIDDEN, 'Permission denied.')

        api_token = token_list[1]

        # main
        try:
            api_token_obj = DTableAPIToken.objects.get_by_token(api_token)
            if api_token_obj is None:
                return api_error(status.HTTP_404_NOT_FOUND, 'api token not found.')

            api_token_obj.update_last_access()
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # resource check
        dtable = api_token_obj.dtable

        table_name = dtable.name
        workspace_id = dtable.workspace_id

        error, workspace, dtable = _resource_check(workspace_id, table_name)
        if error:
            return error

        # generate json web token
        payload = {
            'exp': int(time.time()) + 86400 * 3,
            'dtable_uuid': dtable.uuid.hex,
            'username': '',
            'permission': api_token_obj.permission if check_user_workspace_quota(dtable.workspace) else 'r',
            'app_name': api_token_obj.app_name,
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
            'app_name': api_token_obj.app_name,
            'access_token': access_token,
            'dtable_uuid': dtable.uuid.hex,
            'dtable_server': DTABLE_SERVER_URL,
            'dtable_socket': DTABLE_SOCKET_URL,
        })


class DTableAppUploadLinkView(APIView):

    throttle_classes = (AnonRateThrottle, )

    def get(self, request):
        """get file upload link by dtable api token

        Permission:
        1. valid token
        """
        # argument check
        auth = request.META.get('HTTP_AUTHORIZATION', '').split()
        if not auth or auth[0].lower() != 'token' or len(auth) != 2:
            return api_error(status.HTTP_403_FORBIDDEN, 'Permission denied.')
        api_token = auth[1]

        # resource check
        try:
            api_token_obj = DTableAPIToken.objects.get_by_token(api_token)
            if not api_token_obj:
                return api_error(status.HTTP_404_NOT_FOUND, 'api token not found.')
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        dtable = api_token_obj.dtable
        table_name = dtable.name
        workspace_id = dtable.workspace_id

        error, workspace, dtable = _resource_check(workspace_id, table_name)
        if error:
            return error

        if not check_user_workspace_quota(workspace):
            return api_error(HTTP_443_ABOVE_QUOTA, 'Asset quota exceeded.')

        # create asset dir
        repo_id = workspace.repo_id
        asset_dir_path = '/asset/' + str(dtable.uuid)
        asset_dir_id = seafile_api.get_dir_id_by_path(repo_id, asset_dir_path)
        if not asset_dir_id:
            try:
                seafile_api.mkdir_with_parents(
                    repo_id, '/', asset_dir_path[1:], api_token_obj.generated_by)
            except Exception as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # get token
        obj_id = json.dumps({'parent_dir': asset_dir_path})
        try:
            token = seafile_api.get_fileserver_access_token(
                repo_id, obj_id, 'upload', '', use_onetime=False)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        upload_link = gen_file_upload_url(token, 'upload-api')

        api_token_obj.update_last_access()
        res = dict()
        res['upload_link'] = upload_link
        res['parent_path'] = asset_dir_path

        return Response(res)


class DTableAppDownloadLinkView(APIView):

    throttle_classes = (AnonRateThrottle, )

    def get(self, request):
        """get file download link by dtable api token

        Permission:
        1. valid token
        """

        # argument check
        auth = request.META.get('HTTP_AUTHORIZATION', '').split()
        if not auth or auth[0].lower() != 'token' or len(auth) != 2:
            return api_error(status.HTTP_403_FORBIDDEN, 'Permission denied.')
        api_token = auth[1]

        path = request.GET.get('path', '/')

        # resource check
        try:
            api_token_obj = DTableAPIToken.objects.get_by_token(api_token)
            if not api_token_obj:
                return api_error(status.HTTP_404_NOT_FOUND, 'api token not found.')
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        dtable = api_token_obj.dtable
        table_name = dtable.name
        workspace_id = dtable.workspace_id

        error, workspace, dtable = _resource_check(workspace_id, table_name)
        if error:
            return error

        repo_id = workspace.repo_id
        asset_dir_path = '/asset/' + str(dtable.uuid)
        asset_dir_id = seafile_api.get_dir_id_by_path(repo_id, asset_dir_path)
        if not asset_dir_id:
            error_msg = 'asset not found.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        target_path = os.path.join(asset_dir_path, path.strip('/')) # target_path is path inside repo


        file_id = seafile_api.get_file_id_by_path(repo_id, target_path.strip('/'))
        if not file_id:
            error_msg = 'path %s not found.' % path
            return  api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        try:
            download_token = seafile_api.get_fileserver_access_token(repo_id,
                                                                     file_id,
                                                                     'download-link',
                                                                     request.user.username,
                                                                     use_onetime=False)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        file_name = os.path.basename(path.rstrip('/'))
        download_link = gen_file_get_url(download_token, file_name)

        return Response({'download_link': download_link})


class DTableAPITokenStatusView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, workspace_id, name):
        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = "Workspace %s not found." % (workspace_id,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable = DTables.objects.get_dtable(workspace, name)
        if not dtable:
            error_msg = "Table %s not found." % (name,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        # permission check
        username = request.user.username
        if not check_dtable_permission(username, dtable.workspace, dtable):
            error_msg = "Permission denied."
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # checkout apps
        tokens = DTableAPIToken.objects.list_by_dtable(dtable)

        # access dtable server
        payload = {
            'admin': 'dtable',
            'exp': int(time.time()) + 60 * 60 * 3
        }
        access_token = jwt.encode(
                payload, DTABLE_PRIVATE_KEY, algorithm='HS256'
        ).decode()
        headers = {
            'authorization': 'Token ' + access_token
        }
        app_status_url = DTABLE_SERVER_URL.strip('/') + '/api/v1/internal/' + dtable.uuid.hex + '/connected-apps/'

        try:
            resp = requests.get(app_status_url, headers=headers)
        except Exception as e:
            logger.error('request url: %s error: %s', app_status_url, e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        if resp.status_code != 200:
            logger.error('request url: %s status code: %s', app_status_url, resp.status_code)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        try:
            connected_apps = resp.json()['connected_apps']
        except Exception as e:
            logger.error('checkout connected apps from response error: %s', e)
            error_msg = "Internal Server Error"
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        app_status = [{
            'app_name': token.app_name,
            'connected': token.app_name in connected_apps,
            'last_access': datetime_to_isoformat_timestr(token.last_access)
        } for token in tokens]
        return Response({'api_status_list': app_status})
