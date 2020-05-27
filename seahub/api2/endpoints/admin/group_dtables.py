import os
import logging

from django.utils.translation import ugettext as _
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from pysearpc import SearpcError
from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.base.templatetags.seahub_tags import email2nickname
from seahub.dtable.models import Workspaces, DTables
import seaserv
from seaserv import seafile_api

from seahub.utils.timeutils import datetime_to_isoformat_timestr

logger = logging.getLogger(__name__)
FILE_TYPE = '.dtable'


class AdminGroupDTables(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAdminUser,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, group_id):
        """
        get workspace by group id
        get dtables from workspace
        :param request:
        :param group_id:
        :return:
        """
        group = seaserv.get_group(group_id)
        if not group:
            error_msg = _('Group not found.')
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        owner = '%s@seafile_group' % (group_id,)
        workspace = Workspaces.objects.get_workspace_by_owner(owner)
        if not workspace:
            error_msg = _('Workspace not found')
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        table_list = []
        dtables = DTables.objects.filter(workspace=workspace)
        for dtable in dtables:
            dtable_dict = dict()
            dtable_dict['id'] = dtable.pk
            dtable_dict['workspace_id'] = dtable.workspace_id
            dtable_dict['uuid'] = dtable.uuid
            dtable_dict['name'] = dtable.name
            dtable_dict['creator'] = email2nickname(dtable.creator)
            dtable_dict['creator_email'] = dtable.creator
            dtable_dict['modifier'] = email2nickname(dtable.modifier)
            dtable_dict['created_at'] = datetime_to_isoformat_timestr(dtable.created_at)
            dtable_dict['updated_at'] = datetime_to_isoformat_timestr(dtable.updated_at)
            table_list.append(dtable_dict)
        return Response({
            'tables': table_list,
            'group_name': group.group_name,
        })


class AdminGroupDTable(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAdminUser,)
    throttle_classes = (UserRateThrottle,)

    def delete(self, request, group_id, table_id):
        """
        delete a dtable from a group
        :param request:
        :param group_id:
        :param table_id:
        :return:
        """
        group = seaserv.get_group(group_id)
        if not group:
            error_msg = _('Group not found.')
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        owner = '%s@seafile_group' % (group_id,)
        workspace = Workspaces.objects.get_workspace_by_owner(owner)
        if not workspace:
            error_msg = _('Workspace not found')
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dtable = DTables.objects.filter(workspace=workspace, id=int(table_id)).first()
        if not dtable:
            error_msg = _('Table not found')
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        username = request.user.username

        # delete asset
        asset_dir_path = '/asset/' + str(dtable.uuid)
        asset_dir_id = seafile_api.get_dir_id_by_path(workspace.repo_id, asset_dir_path)
        if asset_dir_id:
            parent_dir = os.path.dirname(asset_dir_path)
            file_name = os.path.basename(asset_dir_path)
            try:
                seafile_api.del_file(workspace.repo_id, parent_dir, file_name, username)
            except SearpcError as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # delete table
        try:
            table_file_name = dtable.name + FILE_TYPE
            seafile_api.del_file(workspace.repo_id, '/', table_file_name, username)
        except SearpcError as e:
            logger.error(e)
            error_msg = _('Internal Server Error.')
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        try:
            DTables.objects.delete_dtable(workspace, dtable.name)
        except Exception as e:
            logger.error(e)
            error_msg = _('Internal Server Error.')
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True}, status=status.HTTP_200_OK)
