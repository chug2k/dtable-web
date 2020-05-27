import logging
from datetime import datetime

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.permissions import IsProVersion, IsOrgAdminUser
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.dtable.models import DTables
from seahub.dtable.utils import restore_trash_dtable_names, convert_dtable_trash_names
from seahub.utils import normalize_file_path
from seaserv import seafile_api, ccnet_api

logger = logging.getLogger(__name__)
FILE_TYPE = '.dtable'


def _check_org(org_id):
    org_id = int(org_id)
    org = ccnet_api.get_org_by_id(org_id)  # todo: wrong
    if not org:
        error_msg = 'Organization %s not found.' % org_id
        return api_error(status.HTTP_404_NOT_FOUND, error_msg), None
    return None, org


class OrgAdminDTablesView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsProVersion, IsOrgAdminUser)

    def get(self, request, org_id):
        # resource check
        error, _ = _check_org(org_id)
        if error:
            return error

        try:
            page = int(request.GET.get('page', 1))
            page = page if page > 0 else 1
            per_page = int(request.GET.get('per_page', 25))
        except:
            error_msg = 'per_page or page invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        start, end = (page - 1) * per_page, page * per_page

        try:
            dtables_count = DTables.objects.filter(deleted=False, workspace__org_id=org_id).count()
            dtables_queryset = DTables.objects.filter(deleted=False, workspace__org_id=org_id).select_related('workspace')[start: end]
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({
            'dtable_list': [d.to_dict() for d in dtables_queryset],
            'count': dtables_count
        })


class OrgAdminDTableView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsProVersion, IsOrgAdminUser)

    def delete(self, request, org_id, dtable_id):
        error, _ = _check_org(org_id)
        if error:
            return error
        # resource check
        dtable = DTables.objects.filter(id=dtable_id, deleted=False, workspace__org_id=org_id).select_related('workspace').first()
        if not dtable:
            error_msg = 'table not found.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        username = request.user.username
        repo_id = dtable.workspace.repo_id
        # rename .dtable file
        new_dtable_name, old_dtable_file_name, new_dtable_file_name = convert_dtable_trash_names(dtable)

        table_path = normalize_file_path(old_dtable_file_name)
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
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True})


class OrgAdminTrashDTablesView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsProVersion, IsOrgAdminUser)

    def get(self, request, org_id):
        error, _ = _check_org(org_id)
        if error:
            return error

        try:
            page = int(request.GET.get('page', 1))
            page = page if page > 0 else 1
            per_page = int(request.GET.get('per_page', 25))
        except:
            error_msg = 'per_page or page invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        start, end = (page - 1) * per_page, page * per_page

        try:
            dtables_count = DTables.objects.filter(deleted=True, workspace__org_id=org_id).count()
            dtables_queryset = DTables.objects.filter(deleted=True, workspace__org_id=org_id).select_related('workspace')[start: end]
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({
            'dtable_list': [d.to_dict(include_deleted=True) for d in dtables_queryset],
            'count': dtables_count
        })

class OrgAdminTrashDTableView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsProVersion, IsOrgAdminUser)

    def put(self, request, org_id, dtable_id):
        error, _ = _check_org(org_id)
        if error:
            return api_error
        # resource check
        dtable = DTables.objects.filter(id=dtable_id, deleted=True, workspace__org_id=org_id).first()
        if not dtable:
            error_msg = 'Table not found.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        new_dtable_name, old_dtable_file_name, new_dtable_file_name = restore_trash_dtable_names(dtable)
        # check existed dtable
        if DTables.objects.get_dtable(dtable.workspace, new_dtable_name):
            error_msg = 'Table with name "%s" exists.' % new_dtable_name
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        seafile_api.rename_file(dtable.workspace.repo_id, '/', old_dtable_file_name, new_dtable_file_name, request.user.username)

        # recover dtable
        try:
            DTables.objects.filter(id=dtable_id, deleted=True).update(deleted=False, delete_time=None, name=new_dtable_name)
        except Exception as e:
            logger.error('recover dtable: %s name: %s error: %s', dtable.id, dtable.name, e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True})
