# -*- coding: utf-8 -*-

import logging
import time
import jwt
import requests
import json

from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import HttpResponse
from django.utils.translation import ugettext as _
from django.utils.http import urlquote


from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.dtable.models import Workspaces, DTables
from seahub.utils.ms_excel import write_xls_with_type
from seahub.settings import DTABLE_PRIVATE_KEY
from seahub.dtable.utils import check_dtable_permission
from seahub.settings import DTABLE_SERVER_URL

logger = logging.getLogger(__name__)


class DTableExportExcel(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request, workspace_id, name):

        # argument check
        table_name = request.GET.get('table_name', '')
        if not table_name:
            error_msg = 'table_name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        view_name = request.GET.get('view_name', '')

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, name)
        if not dtable:
            error_msg = 'DTable %s not found.' % name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        permission = check_dtable_permission(request.user.username, workspace, dtable)
        if not permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # generate json web token
        # internal usage exp 60 seconds, username = dtable-web
        payload = {
            'exp': int(time.time()) + 60,
            'dtable_uuid': dtable.uuid.hex,
            'username': 'dtable-web',
            'permission': permission,
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
            if table.get('name', '') == table_name:
                target_table = table

        if not target_table:
            error_msg = _('Table %s not found.') % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        cols = target_table.get('columns', [])
        head_list = [(col.get('name', ''), col.get('type', ''), col.get('data', '')) for col in cols]

        # 2. get row from dtable-server
        url = DTABLE_SERVER_URL + 'api/v1/dtables/' + dtable.uuid.hex + '/rows/'
        headers = {'Authorization': 'Token ' + access_token.decode('utf-8')}
        query_param = {
            'table_name': table_name,
            'view_name': view_name
        }
        try:
            res = requests.get(url, headers=headers, params=query_param)
        except requests.HTTPError as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        if res.status_code == status.HTTP_404_NOT_FOUND:
            if not view_name:
                error_msg = _('Table %s not found.') % table_name
            else:
                error_msg = _('Table %s or View %s not found.') % (table_name, view_name)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        rows = json.loads(res.content).get('rows', [])
        data_list = []
        for row_from_server in rows:
            row = []
            for col in cols:
                cell_data = row_from_server.get(col['name'], '')
                row.append(cell_data)
            data_list.append(row)

        excel_name = name + '_' + table_name + ('_' + view_name if view_name else '')
        try:
            wb = write_xls_with_type(table_name + ('_' + view_name if view_name else ''), head_list, data_list)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        response = HttpResponse(content_type='application/ms-excel')
        response['Content-Disposition'] = 'attachment;filename*=UTF-8\'\'' + urlquote(excel_name) + '.xlsx'
        wb.save(response)

        return response
