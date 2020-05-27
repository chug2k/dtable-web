# -*- coding: utf-8 -*-
import json
import logging
import time
import jwt
import os
import shutil
import requests
from zipfile import is_zipfile

from django.http import HttpResponse
from django.utils.http import urlquote
from django.utils.translation import ugettext as _
from django.core.files.uploadhandler import TemporaryFileUploadHandler
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from seaserv import seafile_api, ccnet_api

from seahub.utils import CsrfExemptSessionAuthentication
from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.dtable.models import Workspaces, DTables
from seahub.dtable.utils import check_dtable_permission, add_dtable_io_task, query_dtable_io_status, \
    cancel_dtable_io_task
from seahub.settings import DTABLE_SERVER_URL, DTABLE_PRIVATE_KEY


logger = logging.getLogger(__name__)


class DTableExportDTable(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request, workspace_id, name):
        """ download dtable zip

        :param request:
        :param workspace_id:
        :param name: dtable name
        :return:
        """

        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, name)
        if not dtable:
            error_msg = 'DTable %s not found.' % name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        permission = check_dtable_permission(request.user.username, workspace, dtable)
        if not permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # get dtable_file_dir_id and asset_dir_id
        dtable_file_dir_id = seafile_api.get_file_id_by_path(repo_id, '/' + name + '.dtable/')
        if not dtable_file_dir_id:
            error_msg = 'DTable %s not found.' % name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        params = {}
        params['username'] = request.user.username
        params['table_name'] = name
        params['repo_id'] = repo_id
        params['dtable_uuid'] = str(dtable.uuid)

        try:
            task_id = add_dtable_io_task(type='export', params=params)
        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error.')

        return Response({'task_id': task_id, "table": dtable.to_dict()})



class DTableImportDTable(APIView):

    authentication_classes = (TokenAuthentication, CsrfExemptSessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def post(self, request, workspace_id):
        """ import dtable from xxx.dtable zip

        :param request:
        :param workspace_id:
        :return:
        """
        # use TemporaryFileUploadHandler, which contains TemporaryUploadedFile
        # TemporaryUploadedFile has temporary_file_path() method
        # in order to change upload_handlers, we must exempt csrf check
        request.upload_handlers = [TemporaryFileUploadHandler(request=request)]
        username = request.user.username

        imported_zip = request.FILES.get('dtable', None)
        if not imported_zip:
            error_msg = 'dtable invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if not imported_zip.name.endswith(('.dtable', '.csv')):
            error_msg = 'dtable %s invalid.' % imported_zip.name
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        dtable_file_name = imported_zip.name   # xxx.dtable
        dtable_name = dtable_file_name.split('.')[0]

        if DTables.objects.filter(workspace_id=workspace_id, name=dtable_name).exists():
            error_msg = _('Table %s already exists.') % dtable_name
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


        # post json file after dtable recored is created
        # because we need to get dtable uuid
        try:
            dtable = DTables.objects.create_dtable(username, workspace, dtable_name)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # permission check
        permission = check_dtable_permission(request.user.username, workspace, dtable)
        if not permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # create dtable from csv
        if imported_zip.name.endswith('.csv'):
            try:
                seafile_api.post_empty_file(repo_id, '/', dtable_name + '.dtable', username)
            except Exception as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

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

            headers = {'Authorization': 'Token ' + access_token.decode('utf-8')}
            url = DTABLE_SERVER_URL + 'api/v1/' + dtable.uuid.hex + '/import-csv/'
            data = {
                'table_name': dtable_name,
                'is_create_base': True,
            }
            files = {
                'csv_file': imported_zip
            }

            try:
                res = requests.post(url, headers=headers, data=data, files=files)
            except Exception as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

            return Response({"table": dtable.to_dict()})

        uploaded_temp_path = imported_zip.temporary_file_path()
        if not is_zipfile(uploaded_temp_path):
            error_msg = _('A *.dtable file is required.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        params = {}
        params['username'] = request.user.username
        params['repo_id'] = repo_id
        params['workspace_id'] = workspace_id
        params['dtable_uuid'] = str(dtable.uuid)
        params['dtable_file_name'] = dtable_file_name
        params['uploaded_temp_path'] = uploaded_temp_path

        try:
            task_id = add_dtable_io_task(type='import', params=params)
        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error.')

        return Response({'task_id': task_id, "table": dtable.to_dict()})



class DTableIOStatus(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        """
        Get task status by task id
        :param request:
        :return:
        """

        task_id = request.GET.get('task_id', '')
        if not task_id:
            error_msg = 'task_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        resp = query_dtable_io_status(task_id)

        if resp.status_code == 400:
            error_msg = 'task_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if not resp.ok:
            logger.error(resp.content)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        is_finished = json.loads(resp.content)['is_finished']
        return Response({'is_finished': is_finished})

    def delete(self, request):
        """
        Delete task by task_id
        :param request:
        :return:
        """

        task_id = request.query_params.get('task_id', '')
        if not task_id:
            error_msg = 'task_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        task_type = request.query_params.get('task_type', '')
        if task_type not in ['export', 'import']:
            error_msg = 'task_type invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        dtable_uuid = request.query_params.get('dtable_uuid', '')
        if not dtable_uuid:
            error_msg = 'dtable_uuid invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        resp = cancel_dtable_io_task(task_id, dtable_uuid)

        if resp.status_code == 400:
            error_msg = 'task_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if not resp.ok:
            logger.error(resp.content)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        if task_type == 'import':
            # when cancel task, we must delete dtable recored from database too.
            try:
                dtable = DTables.objects.get(uuid=dtable_uuid)
                dtable.delete()
            except Exception:
                pass

        tmp_dir = os.path.join('/tmp/dtable-io', dtable_uuid)
        if os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir)

        return Response({'success': True})


class DTableExportContent(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):

        task_id = request.GET.get('task_id', '')
        if not task_id:
            error_msg = 'task_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        dtable_uuid = request.GET.get('dtable_uuid', '')
        if not dtable_uuid:
            error_msg = 'dtable_uuid invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
        if not dtable:
            error_msg = 'DTable not found.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace.id)
        if not workspace:
            error_msg = 'Workspace not found.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        permission = check_dtable_permission(request.user.username, workspace, dtable)
        if not permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        tmp_zip_path = os.path.join('/tmp/dtable-io', str(dtable.uuid), 'zip_file') + '.zip'
        if not os.path.exists(tmp_zip_path):
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        with open(tmp_zip_path, 'rb') as f:
            zip_stream = f.read()

        tmp_dir = os.path.join('/tmp/dtable-io', dtable_uuid)
        if os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir)

        response = HttpResponse(zip_stream, content_type="application/x-zip-compressed")
        response['Content-Disposition'] = 'attachment;filename*=UTF-8\'\'' + urlquote(dtable.dtable_name) + '.dtable'
        return response
