import logging
import time

import jwt
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.constants import PERMISSION_READ_WRITE
from seahub.api2.utils import api_error
from seahub.dtable.models import Workspaces, DTables, DTableExternalLinks, DTablePlugins
from seahub.dtable.utils import gen_dtable_external_link, check_dtable_admin_permission
from seahub.settings import DTABLE_PRIVATE_KEY


logger = logging.getLogger(__name__)


def _permission_check(user, owner):
    if not user.permissions.can_generate_external_link():
        return None
    return check_dtable_admin_permission(user.username, owner)

def _get_external_link_info(dtable_external_link):
        return {
            'url': gen_dtable_external_link(dtable_external_link.token),
            'token': dtable_external_link.token,
            'permission': 'read-write' if dtable_external_link.permission == PERMISSION_READ_WRITE else 'read-only'
        }

class DTableExternalLinksView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, workspace_id, name):
        username = request.user.username
        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable = DTables.objects.get_dtable(workspace, name)
        if not dtable:
            error_msg = 'SeaTable %s not found.' % name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        if not _permission_check(request.user, workspace.owner):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        try:
            dtable_external_links = DTableExternalLinks.objects.get_dtable_external_link(dtable)
        except Exception as e:
            logger.error('user: %s get dtable: %s external link error: %s', username, name, e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        links = [_get_external_link_info(item) for item in dtable_external_links]

        return Response({'links': links})

    def post(self, request, workspace_id, name):
        username = request.user.username
        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable = DTables.objects.get_dtable(workspace, name)
        if not dtable:
            error_msg = 'SeaTable %s not found.' % name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        if not _permission_check(request.user, workspace.owner):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        try:
            dtable_external_link = DTableExternalLinks.objects.create_dtable_external_link(dtable, username)
        except Exception as e:
            logger.error('user: %s create dtable: %s, external link token error: %s', username, name, e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        return Response(_get_external_link_info(dtable_external_link))


class DTableExternalLinkView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)
    
    def delete(self, request, workspace_id, name, token):
        username = request.user.username
        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable = DTables.objects.get_dtable(workspace, name)
        if not dtable:
            error_msg = 'SeaTable %s not found.' % name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable_external_link = DTableExternalLinks.objects.filter(token=token, dtable=dtable).first()
        if not dtable_external_link:
            error_msg = 'token %s not found.' % token
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        if not _permission_check(request.user, workspace.owner):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # delete
        try:
            dtable_external_link.delete()
        except Exception as e:
            logger.error('user: %s delete table: %s error: %s', username, name, e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True})


class DTableExternalLinkAccessTokenView(APIView):

    throttle_classes = (UserRateThrottle,)

    def get(self, request, token):
        # resource check
        dtable_external_link = DTableExternalLinks.objects.filter(token=token, dtable__deleted=False).select_related('dtable').first()
        if not dtable_external_link:
            error_msg = 'Token %s not found' % token
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable = dtable_external_link.dtable

        # gen access token
        payload = {
            'exp': int(time.time()) + 86400 * 3,
            'dtable_uuid': dtable.uuid.hex,
            'permission': 'r',
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
        })


class DTableExternalLinkPluginsView(APIView):

    throttle_classes = (UserRateThrottle,)

    def get(self, request, token):

        # resource check
        dtable_external_link = DTableExternalLinks.objects.filter(token=token, dtable__deleted=False).select_related('dtable').first()
        if not dtable_external_link:
            error_msg = 'Token %s not found' % token
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = dtable_external_link.dtable

        plugins = DTablePlugins.objects.filter(dtable=dtable)
        return Response({'plugin_list': [plugin.to_dict() for plugin in plugins]})