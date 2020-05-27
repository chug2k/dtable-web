import logging
import time
import jwt

from django.utils.translation import ugettext as _
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.permissions import CanGenerateShareLink
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.constants import PERMISSION_READ
from seahub.dtable.models import DTables, DTableShareLinks, Workspaces
from seahub.settings import DTABLE_PRIVATE_KEY
from seahub.dtable.utils import gen_share_dtable_link, check_dtable_admin_permission, check_user_workspace_quota

from seaserv import seafile_api

logger = logging.getLogger(__name__)


def get_share_dtable_link_info(sdl, dtable):
    data = {
        'username': sdl.username,
        'permission': sdl.permission,
        'token': sdl.token,
        'link': gen_share_dtable_link(sdl.token),
        'dtable': dtable.name,
        'dtable_id': dtable.id,
        'workspace_id': dtable.workspace_id,
        'expire_date': sdl.expire_date,
        'ctime': sdl.ctime,
    }

    return data


class DTableShareLinksView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, CanGenerateShareLink)
    throttle_classes = (UserRateThrottle,)

    def get(self, request):
        """
        get dtable all share links of such user
        :param request:
        :return:
        """
        username = request.user.username
        workspace_id = request.GET.get('workspace_id')
        if not workspace_id:
            error_msg = _('workspace_id invalid.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        table_name = request.GET.get('table_name')
        if not table_name:
            error_msg = _('table_name invalid.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = _('Workspace %(workspace)s not found' % {'workspace': workspace_id})
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        repo = seafile_api.get_repo(workspace.repo_id)
        if not repo:
            error_msg = _('Library %(workspace)s not found' % {'workspace': workspace_id})
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable = DTables.objects.get_dtable(workspace_id, table_name)
        if not dtable:
            error_msg = _('DTable %(table)s not found' % {'table': table_name})
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # get table's all links of user
        dsls = DTableShareLinks.objects.filter(dtable=dtable, username=username)
        results = [get_share_dtable_link_info(item, dtable) for item in dsls]
        return Response({
            'dtable_share_links': results
        })

    def post(self, request):
        # role permission check
        if not request.user.permissions.can_generate_share_link():
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # argument check
        workspace_id = request.data.get('workspace_id')
        if not workspace_id:
            error_msg = 'workspace_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_name = request.data.get('table_name')
        if not table_name:
            error_msg = 'table_name invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        link_permission = request.data.get('permission')
        if link_permission and link_permission not in [perm[0] for perm in DTableShareLinks.PERMISSION_CHOICES]:
            error_msg = _('Permission invalid')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        link_permission = link_permission if link_permission else PERMISSION_READ

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = _('Workspace %(workspace)s not found' % {'workspace': workspace_id})
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        repo = seafile_api.get_repo(workspace.repo_id)
        if not repo:
            error_msg = _('Library %(repo)s not found' % {'repo': workspace.repo_id})
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable = DTables.objects.get_dtable(workspace_id, table_name)
        if not dtable:
            error_msg = _('DTable %(table)s not found' % {'table': table_name})
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        if not check_dtable_admin_permission(request.user.username, dtable.workspace.owner):
            error_msg = _('Permission denied.')
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        username = request.user.username
        try:
            sdl = DTableShareLinks.objects.create_link(dtable.id, username,
                                                       permission=link_permission)
        except Exception as e:
            logger.error(e)
            error_msg = _('Internal Server Error')
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        data = get_share_dtable_link_info(sdl, dtable)
        return Response(data)


class DTableSharedLinkView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, CanGenerateShareLink)
    throttle_classes = (UserRateThrottle,)

    def delete(self, request, token):
        dsl = DTableShareLinks.objects.filter(token=token).first()
        if not dsl:
            return Response({'success': True})

        username = request.user.username
        if not check_dtable_admin_permission(username, dsl.dtable.workspace.owner):
            error_msg = _('Permission denied.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        try:
            dsl.delete()
        except Exception as e:
            logger.error(e)
            error_msg = _('Internal server error')
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        return Response({'success': True})


class DTableShareLinkAccessTokenView(APIView):

    throttle_classes = (UserRateThrottle,)

    def get(self, request):
        """get dtable share link access token
        """

        # argument check
        token = request.GET.get('token', None)
        if not token:
            error_msg = 'token invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        dsl = DTableShareLinks.objects.filter(token=token).first()
        if not dsl:
            error_msg = 'Share link %s not found.' % token
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace = Workspaces.objects.get_workspace_by_id(dsl.dtable.workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % dsl.workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo = seafile_api.get_repo(workspace.repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % workspace.repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable_by_uuid(dsl.dtable.uuid)
        if not dtable:
            error_msg = 'DTable %s not found.' % dsl.dtable.uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # generate jwt
        payload = {
            'exp': int(time.time()) + 86400 * 3,
            'dtable_uuid': dtable.uuid.hex,
            'username': dsl.username,
            'permission': dsl.permission if check_user_workspace_quota(dtable.workspace) else 'r',
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
