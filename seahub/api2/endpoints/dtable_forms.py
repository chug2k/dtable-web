# -*- coding: utf-8 -*-
import os
import logging
import time
import json
from datetime import datetime
from urllib import parse

import requests
import jwt

from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.core.urlresolvers import reverse
from django.utils import timezone

from seaserv import seafile_api, ccnet_api

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.status import HTTP_443_ABOVE_QUOTA
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.dtable.models import Workspaces, DTables, DTableForms, DTableFormShare
from seahub.dtable.utils import check_dtable_permission, FORM_UPLOAD_IMG_RELATIVE_PATH, \
    UPLOAD_IMG_RELATIVE_PATH, UPLOAD_FILE_RELATIVE_PATH, ANONYMOUS, LOGIN_USERS, SHARED_GROUPS, \
    check_form_submit_permission, check_user_workspace_quota
from seahub.dtable.signals import submit_form
from seahub.constants import PERMISSION_READ_WRITE
from seahub.settings import DTABLE_WEB_SERVICE_URL
from seahub.utils import gen_file_upload_url, is_org_context, check_filename_with_rename
from seahub.group.utils import group_id_to_name, is_group_member

logger = logging.getLogger(__name__)


class SharedFormsView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        """get shared forms
        """
        username = request.user.username

        org_id = -1
        if is_org_context(request):
            org_id = request.user.org.org_id

        if org_id and org_id > 0:
            groups = ccnet_api.get_org_groups_by_user(org_id, username)
        else:
            groups = ccnet_api.get_groups(username, return_ancestors=True)

        group_ids = [group.id for group in groups]
        group_name_map = {group_id: group_id_to_name(group_id) for group_id in group_ids}

        try:
            shared_queryset = DTableFormShare.objects.list_by_group_ids(group_ids)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        shared_list = list()
        for item in shared_queryset:
            form = item.form
            if form.share_type != SHARED_GROUPS:
                continue
            data = form.to_dict()

            group_id = item.group_id
            data["group_name"] = group_name_map.get(group_id)
            data["group_id"] = group_id

            shared_list.append(data)

        return Response({'shared_list': shared_list}, status=status.HTTP_200_OK)


def _resource_check(workspace_id, table_name):
    workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
    if not workspace:
        error_msg = 'Workspace %s not found.' % workspace_id
        return None, None, error_msg

    repo_id = workspace.repo_id
    repo = seafile_api.get_repo(repo_id)
    if not repo:
        error_msg = 'Library %s not found.' % repo_id
        return None, None, error_msg

    dtable = DTables.objects.get_dtable(workspace, table_name)
    if not dtable:
        error_msg = 'DTable %s not found.' % table_name
        return None, None, error_msg

    return workspace, dtable, None


class DTableFormsView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        """get dtable forms
        Permission:
        1. owner
        2. group member
        3. shared user with `rw`
        """
        username = request.user.username
        # argument check
        workspace_id = request.GET.get('workspace_id')
        table_name = request.GET.get('name')

        # get user forms
        if not workspace_id and not table_name:
            org_id = -1
            if is_org_context(request):
                org_id = request.user.org.org_id

            if org_id and org_id > 0:
                groups = ccnet_api.get_org_groups_by_user(org_id, username)
            else:
                groups = ccnet_api.get_groups(username, return_ancestors=True)

            owner_list = list()
            owner_list.append(username)
            for group in groups:
                group_user = '%s@seafile_group' % group.id
                owner_list.append(group_user)

            try:
                # workspaces
                workspace_queryset = Workspaces.objects.filter(owner__in=owner_list)
                workspace_ids = [workspace.id for workspace in workspace_queryset]
                form_queryset = DTableForms.objects.filter(workspace_id__in=workspace_ids)
            except Exception as e:
                logger.error(e)
                error_msg = 'Internal Server Error.'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

            # forms
            group_name_map = {group.id: group_id_to_name(group.id) for group in groups}
            form_list = list()
            for form in form_queryset:
                data = form.to_dict()

                workspace_id = form.workspace_id
                workspace = workspace_queryset.get(id=workspace_id)
                owner = workspace.owner
                if '@seafile_group' in owner:
                    group_id = int(owner.split('@')[0])
                    data["group_name"] = group_name_map.get(group_id)
                    data["group_id"] = group_id

                form_list.append(data)

            return Response({"form_list": form_list}, status=status.HTTP_200_OK)

        # get dtable forms 
        else:
            if not workspace_id:
                error_msg = 'workspace_id invalid.'
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            if not table_name:
                error_msg = 'name invalid.'
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            # resource check
            workspace, dtable, error_msg = _resource_check(workspace_id, table_name)
            if error_msg:
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)

            # permission check
            if check_dtable_permission(username, workspace, dtable) != PERMISSION_READ_WRITE:
                error_msg = 'Permission denied.'
                return api_error(status.HTTP_403_FORBIDDEN, error_msg)

            dtable_uuid = dtable.uuid.hex
            try:
                forms = DTableForms.objects.get_forms_by_dtable_uuid(dtable_uuid)
            except Exception as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

            form_list = [form_obj.to_dict() for form_obj in forms]

            return Response({"form_list": form_list}, status=status.HTTP_200_OK)

    def post(self, request):
        """create a dtable form
        Permission:
        1. owner
        2. group member
        3. shared user with `rw`
        """
        # argument check
        workspace_id = request.POST.get('workspace_id')
        if not workspace_id:
            error_msg = 'workspace_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_name = request.POST.get('name')
        if not table_name:
            error_msg = 'name invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        form_id = request.POST.get('form_id')
        if not form_id:
            error_msg = 'form_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        form_config = request.POST.get('form_config', None)

        # resource check
        workspace, dtable, error_msg = _resource_check(workspace_id, table_name)
        if error_msg:
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        if check_dtable_permission(username, workspace, dtable) != PERMISSION_READ_WRITE:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        dtable_uuid = dtable.uuid.hex
        form_obj = DTableForms.objects.get_form_by_form_id(dtable_uuid, form_id)
        if form_obj:
            error_msg = 'Table form %s already exists.' % form_id
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        try:
            form_obj = DTableForms.objects.add_form_obj(
                username, workspace_id, dtable_uuid, form_id, form_config
            )
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        form = form_obj.to_dict()

        return Response({"form": form}, status=status.HTTP_201_CREATED)


class DTableFormView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def delete(self, request, token):
        """ delete a form.
        Permission:
        1. owner
        2. group member
        3. shared user with `rw`
        """
        # resource check
        form_obj = DTableForms.objects.get_form_by_token(token)
        if not form_obj:
            return Response({'success': True}, status=status.HTTP_200_OK)

        # permission check
        username = request.user.username
        dtable = DTables.objects.get_dtable_by_uuid(form_obj.dtable_uuid)
        if not dtable:
            error_msg = 'DTable %s not found.' % form_obj.dtable_uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        workspace = dtable.workspace

        if check_dtable_permission(username, workspace, dtable) != PERMISSION_READ_WRITE:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        try:
            DTableForms.objects.delete_form(token)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True}, status=status.HTTP_200_OK)

    def put(self, request, token):
        """update a dtable form config
        Permission:
        1. owner
        2. group member
        3. shared user with `rw`
        """
        # argument check
        form_config = request.POST.get('form_config')
        if not form_config:
            error_msg = 'form_config invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        form_obj = DTableForms.objects.get_form_by_token(token)
        if not form_obj:
            error_msg = 'Form %s not found.' % token
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        dtable = DTables.objects.get_dtable_by_uuid(form_obj.dtable_uuid)
        if not dtable:
            error_msg = 'DTable %s not found.' % form_obj.dtable_uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        workspace = dtable.workspace

        if check_dtable_permission(username, workspace, dtable) != PERMISSION_READ_WRITE:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        try:
            form_obj.form_config = form_config
            form_obj.save()
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        form = form_obj.to_dict()

        return Response({"form": form}, status=status.HTTP_200_OK)


class DTableFormShareView(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def post(self, request, token):
        """share form to groups
        Permission:
        1. owner
        2. group member
        3. shared user with `rw`
        """
        # argument check
        share_type = request.data.get('share_type')
        if share_type not in (ANONYMOUS, LOGIN_USERS, SHARED_GROUPS) :
            error_msg = 'share_type invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if share_type == SHARED_GROUPS:
            group_ids = request.data.get('group_ids')
            try:
                group_ids = [int(group_id) for group_id in group_ids]
                group_ids = list(set(group_ids))
            except Exception as e:
                error_msg = 'group_ids invalid.'
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        form_obj = DTableForms.objects.get_form_by_token(token)
        if not form_obj:
            error_msg = 'Form %s not found.' % token
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        dtable = DTables.objects.get_dtable_by_uuid(form_obj.dtable_uuid)
        if not dtable:
            error_msg = 'DTable %s not found.' % form_obj.dtable_uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        workspace = dtable.workspace

        if check_dtable_permission(username, workspace, dtable) != PERMISSION_READ_WRITE:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        last_share_type = form_obj.share_type
        try:
            if share_type != last_share_type:
                form_obj.share_type = share_type
                form_obj.save(update_fields=['share_type'])

            if share_type != SHARED_GROUPS and last_share_type == SHARED_GROUPS:
                DTableFormShare.objects.filter(form=form_obj).delete()

            if share_type == SHARED_GROUPS:
                exists_group_ids = DTableFormShare.objects.list_by_form(form_obj)
                delete_list = [group_id for group_id in exists_group_ids if group_id not in group_ids]
                add_list = [group_id for group_id in group_ids if group_id not in exists_group_ids]
                if delete_list:
                    DTableFormShare.objects.filter(form=form_obj, group_id__in=delete_list).delete()
                for group_id in add_list:
                    if not is_group_member(group_id, username):
                        error_msg = 'Group %d permission denied.' % group_id
                        return api_error(status.HTTP_403_FORBIDDEN, error_msg)
                    DTableFormShare.objects.share_by_group_id(form_obj, group_id)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({"success": True}, status=status.HTTP_200_OK)


class DTableFormSubmitView(APIView):

    throttle_classes = (UserRateThrottle, )

    def _migrate_image(self, dtable, link):
        """
        migrate asset from forms path to dtable asset path
        :param dtable: which dtable
        :param link: form asset link
        :return: (error, None) or (None, new_link)
        """
        link = parse.unquote(link.strip('/'))
        image_name = os.path.basename(link)
        form_image_path = os.path.join('/asset', str(dtable.uuid), FORM_UPLOAD_IMG_RELATIVE_PATH, image_name)
        repo_id = dtable.workspace.repo_id
        if not seafile_api.get_file_id_by_path(repo_id, form_image_path):
            logger.error('can\'t find form image by path: %s', form_image_path)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal server error'), None

        dtable_asset_image_dir = os.path.join('/asset', str(dtable.uuid), UPLOAD_IMG_RELATIVE_PATH, str(datetime.today())[:7])
        dtable_asset_image_dir_id = seafile_api.get_dir_id_by_path(repo_id, dtable_asset_image_dir)
        if not dtable_asset_image_dir_id:
            seafile_api.mkdir_with_parents(repo_id, '/', dtable_asset_image_dir[1:], 'form')
        new_image_name = check_filename_with_rename(repo_id, dtable_asset_image_dir, image_name)

        seafile_api.move_file(repo_id, os.path.dirname(form_image_path), image_name,
                              repo_id, dtable_asset_image_dir, new_image_name, 0, 'form', 0)

        path = os.path.join(UPLOAD_IMG_RELATIVE_PATH, str(datetime.today())[:7], new_image_name)
        new_image_url = '/workspace/%s/asset/%s/%s' % (dtable.workspace_id, str(dtable.uuid), path)

        return None, DTABLE_WEB_SERVICE_URL.rstrip('/') + new_image_url

    def post(self, request, token):
        """Submit a form
        """
        # argument check
        row_data = request.POST.get("row_data", None)
        if not row_data:
            error_msg = 'row_data invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        table_id = request.POST.get("table_id", None)
        if not table_id:
            error_msg = 'table_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        form_obj = DTableForms.objects.get_form_by_token(token)
        if not form_obj:
            error_msg = 'Form %s not found.' % token
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace_id = form_obj.workspace_id
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable_uuid = form_obj.dtable_uuid
        dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
        if not dtable:
            error_msg = 'Table %s not found.' % dtable_uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        if not check_form_submit_permission(request, form_obj):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # quota check
        if not check_user_workspace_quota(dtable.workspace):
            error_msg = 'Asset quota exceeded.'
            return api_error(HTTP_443_ABOVE_QUOTA, error_msg)

        # generate json web token
        payload = {
            'exp': int(time.time()) + 60 * 5,
            'dtable_uuid': dtable_uuid,
            'username': "form",
            'permission': PERMISSION_READ_WRITE,
        }

        try:
            access_token = jwt.encode(
                payload, settings.DTABLE_PRIVATE_KEY, algorithm='HS256'
            )
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        headers = {"Authorization": "Token %s" % access_token.decode()}

        # get dtable columns from metadata
        metadata_url = '%s/api/v1/dtables/%s/metadata/' % \
            (settings.DTABLE_SERVER_URL.strip('/'), form_obj.dtable_uuid)
        try:
            response = requests.get(metadata_url, headers=headers)
            response = response.json()
            tables = response.get('metadata')['tables']
            table = [table for table in tables if table['_id'] == table_id][0]
            columns = table['columns']
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # migrate image files from assets/xxx/forms/xxx to assets/xxx/images/xxx
        row_data_dict = json.loads(row_data)
        form_column_keys = [col['key'] for col in json.loads(form_obj.form_config)['columns']]
        image_keys = [col['key'] for col in columns if col['key'] in form_column_keys and col['type'] == 'image']
        for key in image_keys:
            image_links = row_data_dict.get(key)
            if not image_links:
                continue
            new_links = []
            for link in image_links:
                error, new_link = self._migrate_image(dtable, link.strip())
                if error:
                    return error
                new_links.append(new_link)
            row_data_dict[key] = new_links

        row_data_dict['_creator'] = request.user.username if request.user.is_authenticated() else 'anonymous'
        row_data_dict['_ctime'] = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat(timespec='milliseconds')


        # insert row
        url = '%s/api/v1/dtables/%s/operations/' % \
              (settings.DTABLE_SERVER_URL.strip('/'), form_obj.dtable_uuid)

        operation = {
            "op_type": "insert_row",
            "table_id": table_id,
            "row_data": row_data_dict,
        }

        try:
            req = requests.post(url, json=operation, headers=headers)

        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        form_config = json.loads(form_obj.form_config)
        notification_config = form_config.get('notification_config', {})

        if notification_config and notification_config.get('is_send_notification', False):
            for user in notification_config.get('notification_selected_users', []):
                try:
                    submit_form.send(sender=None,
                                     dtable_id=dtable.id,
                                     table_id=table_id,
                                     form_name=form_config.get('form_name', ''),
                                     submit_user=request.user.username,
                                     to_user=user.get('email', ''))
                except Exception as e:
                    logging.error(e)

        resp = json.loads(req.text) if req.text else {"success": False}
        return Response(resp, status=req.status_code)


class DTableFormUploadLinkView(APIView):
    throttle_classes = (UserRateThrottle,)

    def get(self, request, token):
        # resource check
        form_obj = DTableForms.objects.get_form_by_token(token)
        if not form_obj:
            error_msg = 'Form %s not found.' % token
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace_id = form_obj.workspace_id
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = workspace.repo_id

        dtable_uuid = form_obj.dtable_uuid
        dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
        if not dtable:
            error_msg = 'Table %s not found.' % dtable_uuid
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        if not check_form_submit_permission(request, form_obj):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        if not check_user_workspace_quota(workspace):
            error_msg = 'Asset quota exceeded.'
            return api_error(HTTP_443_ABOVE_QUOTA, error_msg)

        # create asset dir
        asset_dir_path = '/asset/' + str(dtable.uuid)
        asset_dir_id = seafile_api.get_dir_id_by_path(repo_id, asset_dir_path)
        if not asset_dir_id:
            seafile_api.mkdir_with_parents(repo_id, '/', asset_dir_path[1:], '')

        # get token
        obj_id = json.dumps({'parent_dir': asset_dir_path})
        try:
            token = seafile_api.get_fileserver_access_token(repo_id, obj_id, 'upload',
                                                            '', use_onetime=False)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        upload_link = gen_file_upload_url(token, 'upload-api')

        res = dict()
        res['upload_link'] = upload_link
        res['parent_path'] = asset_dir_path
        res['img_relative_path'] = FORM_UPLOAD_IMG_RELATIVE_PATH
        res['file_relative_path'] = os.path.join(UPLOAD_FILE_RELATIVE_PATH, str(datetime.today())[:7])
        return Response(res)
