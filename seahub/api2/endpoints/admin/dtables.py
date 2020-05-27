# Copyright (c) 2012-2019 Seafile Ltd.
import logging

from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.utils.translation import ugettext as _
from seaserv import ccnet_api, seafile_api

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.dtable.models import DTables
from seahub.dtable.utils import restore_trash_dtable_names

logger = logging.getLogger(__name__)


def get_dtable_info(dtable, include_deleted=False):
    dtable_info = dtable.to_dict(include_deleted=include_deleted)
    dtable_info['org_id'] = dtable.workspace.org_id
    if dtable.workspace.org_id != -1:
        org = ccnet_api.get_org_by_id(dtable.workspace.org_id)
        if org:
            dtable_info.update({
                'org_name': org.org_name,
            })
    return dtable_info


class AdminDtables(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsAdminUser,)

    def get(self, request, format=None):
        """ List 'all' dtables

            Permission checking:
            1. only admin can perform this action.
        """

        # list dtables by page
        try:
            current_page = int(request.GET.get('page', '1'))
            per_page = int(request.GET.get('per_page', '100'))
        except ValueError:
            current_page = 1
            per_page = 100

        start = (current_page - 1) * per_page
        end = start + per_page

        try:
            # not include org
            dtables_count = DTables.objects.filter(deleted=False).count()
            dtables_queryset = DTables.objects.filter(deleted=False).select_related('workspace')[start: end]
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        if dtables_count > end:
            has_next_page = True
        else:
            has_next_page = False

        page_info = {
            'has_next_page': has_next_page,
            'current_page': current_page
        }

        return_results = list()

        for dtable in dtables_queryset:
            return_results.append(get_dtable_info(dtable))

        return Response({"page_info": page_info, "dtables": return_results})


class AdminTrashDTablesView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsAdminUser,)

    def get(self, request):
        # argument check
        try:
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 20))
        except Exception as e:
            error_msg = 'per_page or page invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        start, end = (page - 1) * per_page, page * per_page
        try:
            dtables = DTables.objects.filter(deleted=True).select_related('workspace').order_by('-delete_time')
        except Exception as e:
            logger.error('get deleted dtables error: %s', e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        count = dtables.count()

        results = [get_dtable_info(dtable, include_deleted=True) for dtable in dtables[start: end]]

        return Response({'count': count, 'trash_dtable_list': results})


class AdminTrashDTableView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsAdminUser,)

    def put(self, request, dtable_id):
        # argument check
        try:
            dtable_id = int(dtable_id)
        except Exception:
            error_msg = 'dtable_id invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        dtable = DTables.objects.filter(id=dtable_id, deleted=True).select_related('workspace').first()
        if not dtable:
            error_msg = 'Table not found'
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
