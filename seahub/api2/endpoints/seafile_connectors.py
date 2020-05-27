import logging
import requests
from django.utils import timezone
from django.utils.translation import ugettext as _
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.dtable.models import Workspaces, DTables, SeafileConnectors
from seaserv import seafile_api

logger = logging.getLogger(__name__)
REPO_INFO_API = '/api/v2.1/via-repo-token/repo-info/'


def _check_token(seafile_url, repo_api_token):
    # request check
    try:
        response = requests.get(seafile_url + REPO_INFO_API, headers={'Authorization': 'token ' + repo_api_token})
        if response.status_code != 200:
            error_msg = 'Seafile server\'s URL or library\'s API Token is invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
    except Exception as e:
        logger.warning('request api:%s error: %s', repo_api_token, e)
        error_msg = 'Seafile server\'s URL or library\'s API Token is invalid'
        return api_error(status.HTTP_400_BAD_REQUEST, error_msg)


def _create_connector(request, seafile_url, repo_api_token, dtable_id):
    err = _check_token(seafile_url, repo_api_token)
    if err:
        return err, None

    # connector check
    if SeafileConnectors.objects.filter(dtable_id=dtable_id).count() > 0:
        error_msg = 'One table can connect only one library with one token now.'
        return api_error(status.HTTP_400_BAD_REQUEST, error_msg), None

    # resource check
    dtable = DTables.objects.filter(id=dtable_id).first()
    if not dtable:
        error_msg = 'Table %(table)s not found' % {'table': dtable_id}
        return api_error(status.HTTP_404_NOT_FOUND, error_msg), None
    workspace_id = dtable.workspace_id
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        error_msg = 'Workspace %(workspace)s not found' % {'workspace': workspace_id}
        return api_error(status.HTTP_404_NOT_FOUND, error_msg), None
    repo = seafile_api.get_repo(workspace.repo_id)
    if not repo:
        error_msg = 'Library %(repo)s not found' % {'repo': workspace.repo_id}
        return api_error(status.HTTP_404_NOT_FOUND, error_msg), None

    username = request.user.username
    try:
        sc = SeafileConnectors.objects.create(dtable=dtable,
                                              seafile_url=seafile_url,
                                              repo_api_token=repo_api_token,
                                              created_by=username)
    except Exception as e:
        logger.error('user: %s bind dtable: %s with seafile_url: %s repo_api_token: %s error: %s',
                     username, dtable_id, seafile_url, repo_api_token, e)
        error_msg = _('Internal server error.')
        return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg), None
    return None, sc


class SeafileConnectorsView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request):
        try:
            dtable_id = int(request.GET.get('dtable_id'))
        except:
            error_msg = 'dtable_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        scs = SeafileConnectors.objects.filter(dtable_id=dtable_id)
        scs = [sc.to_dict() for sc in scs]
        return Response({'seafile_connectors': scs})

    def post(self, request):
        # argument check
        seafile_url = request.data.get('seafile_url')
        if not seafile_url or not seafile_url.startswith('http'):
            error_msg = 'Seafile Server URL invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        seafile_url = seafile_url.rstrip('/')
        dtable_id = request.data.get('dtable_id')
        if not dtable_id:
            error_msg = 'dtable_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        repo_api_token = request.data.get('repo_api_token')
        if not repo_api_token:
            error_msg = 'Library API Token invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        error, sc = _create_connector(request, seafile_url, repo_api_token, dtable_id)
        if error:
            return error

        return Response(sc.to_dict())


class SeafileConnectorView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def put(self, request, connector_id):
        connector_id = int(connector_id)
        # argument check
        seafile_url = request.data.get('seafile_url')
        if not seafile_url or not seafile_url.startswith('http'):
            error_msg = 'Seafile Server URL invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        seafile_url = seafile_url.rstrip('/')
        dtable_id = request.data.get('dtable_id')
        if not dtable_id:
            error_msg = 'dtable_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        repo_api_token = request.data.get('repo_api_token')
        if not repo_api_token:
            error_msg = 'Library API Token invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        err = _check_token(seafile_url, repo_api_token)
        if err:
            return err

        # connector check
        sc = SeafileConnectors.objects.filter(id=connector_id).first()
        if not sc:
            error_msg = 'Such connector does not exist.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        now = timezone.now()
        update_data = {
            'seafile_url': seafile_url,
            'repo_api_token': repo_api_token,
            'created_at': now,
            'created_by': request.user.username
        }
        try:
            SeafileConnectors.objects.filter(id=connector_id).update(**update_data)
        except Exception as e:
            logger.error('delete connector: %s error: %s', connector_id, e)
            error_msg = _('Internal Server Error.')
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        data = sc.to_dict()
        data.update(update_data)
        return Response(data)
