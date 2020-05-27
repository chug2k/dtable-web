# -*- coding: utf-8 -*-
import json
import logging
import time
import requests
import jwt

from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from django.utils.translation import ugettext as _
from django.utils import timezone

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error, get_user_common_info
from seahub.dtable.models import Workspaces, DTables, DTableCommonDataset
from seahub.utils import is_org_context
from seahub.settings import DTABLE_PRIVATE_KEY, DTABLE_SERVER_URL
from seahub.dtable.utils import check_dtable_permission, check_dtable_admin_permission, \
    list_dtable_related_users


logger = logging.getLogger(__name__)


class DTableCommonDatasetsView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        """ List Common Datasets user can access through group
            params:
                from_dtable_id, optional, if given, return sets from_dtable can access
        """

        username = request.user.username

        org_id = -1
        if is_org_context(request):
            org_id = request.user.org.org_id

        datasets = DTableCommonDataset.objects.filter(org_id=org_id)

        from_dtable_id = request.GET.get('from_dtable_id', '')
        if from_dtable_id:
            try:
                from_dtable = DTables.objects.get(pk=from_dtable_id)
            except DTables.DoesNotExist:
                error_msg = 'from_dtable %s not found.' % from_dtable_id
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)
            available_sets = [dataset for dataset in datasets if dataset.can_access_by_dtable(from_dtable)]
        else:
            available_sets = [dataset for dataset in datasets if dataset.can_access_by_user_through_group(username)]

        dataset_list = []
        for dataset in available_sets:
            data = dataset.to_dict()
            data['can_manage'] = dataset.can_manage_by_user(username)
            dataset_list.append(data)

        return Response({'dataset_list': dataset_list})

    def post(self, request):
        """ Create a Common Dataset
        :param dataset_name: name of dataset
        :param dtable_name: name of dtable
        :param table_name: name of subtable
        :param view_name: name of view
            1. check params, resources and permissions
            2. get dtable data from dtable_esrver
            3. store data in database
        """

        if not request.user.permissions.can_create_common_dataset():
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # params check
        dataset_name = request.data.get('dataset_name', '')
        if not dataset_name:
            error_msg = 'dataset_name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        dtable_name = request.data.get('dtable_name', '')
        if not dtable_name:
            error_msg = 'dtable_name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_name = request.data.get('table_name', '')
        if not table_name:
            error_msg = 'table_name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        view_name = request.data.get('view_name', '')
        if not view_name:
            error_msg = 'view_name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        org_id = -1
        if is_org_context(request):
            org_id = request.user.org.org_id

        # check duplicate by name
        set_with_duplicate_name = DTableCommonDataset.objects.filter(org_id=org_id, dataset_name=dataset_name)
        if len(set_with_duplicate_name) >= 1:
            error_msg = _('Common Dataset with name: %s already exists.') % dataset_name
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        dtable = DTables.objects.filter(name=dtable_name).first()
        if not dtable:
            error_msg = 'DTable %s not found.' % dtable_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        if not dtable.is_owned_by_group:
            error_msg = _('Common Dataset could only be created from group owned dtables.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % dtable.workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        if not check_dtable_admin_permission(request.user.username, workspace.owner):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        access_permission = check_dtable_permission(request.user.username, workspace, dtable)
        if not access_permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # generate json web token
        # internal usage exp 60 seconds, username = dtable-web
        payload = {
            'exp': int(time.time()) + 60,
            'dtable_uuid': dtable.uuid.hex,
            'username': 'dtable-web',
            'permission': access_permission,
        }
        try:
            access_token = jwt.encode(
                payload, DTABLE_PRIVATE_KEY, algorithm='HS256'
            )
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        url = DTABLE_SERVER_URL + 'dtables/' + dtable.uuid.hex
        headers = {'Authorization': 'Token ' + access_token.decode('utf-8')}
        query_param = {
            'lang': 'en',
        }
        try:
            res = requests.get(url, headers=headers, params=query_param)
        except requests.HTTPError as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        res = json.loads(res.content)

        tables = res.get('tables', [])
        target_table = next(filter(lambda table: table.get('name') == table_name, tables), None)

        if not target_table:
            error_msg = 'table %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        target_view = next(filter(lambda view: view.get('name') == view_name, target_table['views']), None)

        if not target_view:
            error_msg = 'view %s not found.' % view_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # check duplicate by dtable uuid, table id, view id
        set_duplicates = DTableCommonDataset.objects.filter(org_id=org_id, dtable_uuid=dtable.uuid, table_id=target_table['_id'], view_id=target_view['_id'])
        if len(set_duplicates) >= 1:
            error_msg = _('Common Dataset with dtable name: %s, table name: %s, view name: %s already exists.') % (dtable_name, table_name, view_name)
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        common_dataset = DTableCommonDataset.objects.create(
            org_id=org_id,
            dtable_uuid=dtable.uuid,
            table_id=target_table['_id'],
            view_id=target_view['_id'],
            creator=request.user.username,
            created_at=timezone.now(),
            dataset_name=dataset_name,
        )

        return Response(common_dataset.to_dict())


class DTableCommonDatasetView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request, dataset_id):
        """ return dataset contents

            param: from_dtable_id, optional
            if from_dtable_id is not given, check access permission by user through group
            if from_dtable_id is given, check access permission by dtable
        """

        # resource check
        try:
            dataset = DTableCommonDataset.objects.get(pk=dataset_id)
        except DTableCommonDataset.DoesNotExist:
            error_msg = 'dataset %s not found.' % dataset_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # perm check
        from_dtable_id = request.GET.get('from_dtable_id', '')
        if from_dtable_id:
            try:
                from_dtable = DTables.objects.get(pk=from_dtable_id)
            except DTables.DoesNotExist:
                error_msg = 'from_dtable %s not found.' % from_dtable_id
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)
            if not dataset.can_access_by_dtable(from_dtable):
                error_msg = 'Permission Denied.'
                return api_error(status.HTTP_403_FORBIDDEN, error_msg)
        else:
            if not dataset.can_access_by_user_through_group(request.user.username):
                error_msg = 'Permission Denied.'
                return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # generate json web token
        dtable = DTables.objects.filter(uuid=dataset.dtable_uuid).first()
        if not dtable:
            error_msg = 'DTable %s not found.' % dataset.dtable_uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace.id)
        if not workspace:
            error_msg = 'Workspace not found.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # internal usage exp 60 seconds, username = dtable-web
        payload = {
            'exp': int(time.time()) + 60,
            'dtable_uuid': dtable.uuid.hex,
            'username': 'dtable-web',
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

        # 1. get cols from dtable-server
        url = DTABLE_SERVER_URL + 'api/v1/dtables/' + dtable.uuid.hex + '/metadata/'
        headers = {'Authorization': 'Token ' + access_token.decode('utf-8')}
        try:
            dtable_metadata = requests.get(url, headers=headers)
        except requests.HTTPError as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        tables = json.loads(dtable_metadata.content)['metadata'].get('tables', [])
        target_table = {}
        for table in tables:
            if table.get('_id', '') == dataset.table_id:
                target_table = table

        if not target_table:
            error_msg = _('Table %s not found.') % dataset.table_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # 2. get rows from dtable server
        url = DTABLE_SERVER_URL + 'api/v1/dtables/' + dtable.uuid.hex + '/rows/'
        headers = {'Authorization': 'Token ' + access_token.decode('utf-8')}
        query_param = {
            'table_id': dataset.table_id,
            'view_id': dataset.view_id
        }
        try:
            res = requests.get(url, headers=headers, params=query_param)
        except requests.HTTPError as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        if res.status_code == status.HTTP_404_NOT_FOUND:
            error_msg = 'table %s or view %s not found.' % (dataset.table_id, dataset.view_id)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        try:
            rows = json.loads(res.content).get('rows', [])
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        related_user_emails = list_dtable_related_users(workspace=workspace, dtable=dtable)
        related_user_list = [get_user_common_info(email) for email in related_user_emails]

        hidden_columns = []
        for view in target_table['views']:
            if dataset.view_id == view.get('_id', ''):
                hidden_columns = view.get('hidden_columns', [])

        show_cols = []
        cols = target_table.get('columns', [])
        for col in cols:
            if col['key'] in hidden_columns:
                continue
            show_cols.append(col)

        return Response({
            'rows': rows,
            'columns': show_cols,
            'related_user_list': related_user_list
        })

    def delete(self, request, dataset_id):

        try:
            dataset = DTableCommonDataset.objects.get(pk=dataset_id)
        except DTableCommonDataset.DoesNotExist:
            error_msg = 'dataset %s not found.' % dataset_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # resource check
        dtable = DTables.objects.filter(uuid=dataset.dtable_uuid).first()
        if not dtable:
            error_msg = 'DTable not found.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % dtable.workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        if not dataset.can_manage_by_user(request.user.username, dtable):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        dataset.delete()

        return Response({'success': True})

