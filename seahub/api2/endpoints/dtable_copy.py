import io
import logging
import json
import os
import re
import shutil
import time
from zipfile import ZipFile, is_zipfile

import requests

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.constants import PERMISSION_READ_WRITE
from seahub.dtable.models import DTables, Workspaces, DTableExternalLinks
from seahub.dtable.utils import check_dtable_permission, FILE_TYPE, check_dtable_admin_permission
from seahub.utils import get_service_url, gen_inner_file_get_url
from seaserv import seafile_api


logger = logging.getLogger(__name__)
TMP_PATH = '/tmp/dtable_for_copy/'
service_url = get_service_url().strip()


def clear_tmp_files_and_dirs(uuid):
    # delete tmp files/dirs
    path = os.path.join(TMP_PATH, uuid)
    if os.path.exists(path):
        shutil.rmtree(path)


def _trans_url(url, workspace_id, dtable_uuid):
    if url.startswith(service_url):
        return re.sub(r'\d+/asset/[-\w]{36}', str(workspace_id) + '/asset/' + str(dtable_uuid), url)
    return url


def _trans_file_url(file, workspace_id, dtable_uuid):
    file['url'] = _trans_url(file['url'], workspace_id, dtable_uuid)
    return file


def _trans_image_url(image_url, workspace_id, dtable_uuid):
    return _trans_url(image_url, workspace_id, dtable_uuid)


def rebuild_content_asset(content, dst_dtable):
    for table in content['tables']:
        img_cols = [col['key'] for col in table['columns'] if col['type'] == 'image']
        file_cols = [col['key'] for col in table['columns'] if col['type'] == 'file']
        for row in table['rows']:
            for img_col in img_cols:
                if img_col in row and isinstance(row[img_col], list):
                    row[img_col] = [_trans_image_url(img, dst_dtable.workspace_id, dst_dtable.uuid) for img in row.get(img_col, [])]
            for file_col in file_cols:
                if file_col in row and isinstance(row[file_col], list):
                    row[file_col] = [_trans_file_url(f, dst_dtable.workspace_id, dst_dtable.uuid) for f in row.get(file_col, [])]
    return content


def copy_asset(src_repo_id, src_dtable_uuid, dst_repo_id, dst_dtable_uuid, username):
    src_asset_dir = os.path.join('/asset', str(src_dtable_uuid))
    src_asset_dir_id = seafile_api.get_dir_id_by_path(src_repo_id, src_asset_dir)
    if src_asset_dir_id:
        dst_asset_dir = os.path.join('/asset', str(dst_dtable_uuid))
        src_asset_base_dir, dst_asset_base_dir = os.path.dirname(src_asset_dir), os.path.dirname(dst_asset_dir)
        if not seafile_api.get_dir_id_by_path(dst_repo_id, dst_asset_base_dir):
            seafile_api.mkdir_with_parents(dst_repo_id, '/', dst_asset_base_dir[1:], username)
        res = seafile_api.copy_file(src_repo_id, src_asset_base_dir, str(src_dtable_uuid),
                                    dst_repo_id, dst_asset_base_dir, str(dst_dtable_uuid),
                                    username=username, need_progress=0, synchronous=1)
        return res


def copy_dtable(src_workspace, src_dtable, dst_workspace, name, username):
    # create dtable
    try:
        dst_dtable = DTables.objects.create_dtable(username, dst_workspace, name)
    except Exception as e:
        logger.error('create table: %s in dst workspace: %s, error: %s', name, dst_workspace.id, e)
        error_msg = 'Internal Server Error'
        return None, api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

    clear_tmp_files_and_dirs(str(dst_dtable.uuid))
    dtable_file_name = name + FILE_TYPE
    cur_dtable_path = os.path.join(TMP_PATH, str(dst_dtable.uuid))

    try:
        # .dtable
        src_dtable_file_id = seafile_api.get_file_id_by_path(src_workspace.repo_id, '/' + dtable_file_name)
        token = seafile_api.get_fileserver_access_token(
            src_workspace.repo_id, src_dtable_file_id, 'view', '', use_onetime=False
        )
        json_url = gen_inner_file_get_url(token, name + FILE_TYPE)
        response = requests.get(json_url)
        if response.status_code != 200:
            logger.error('request dtable url response error status: %s', response.status_code)
            return None, api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')
        if response.content:
            # rebuild asset images files url
            dtable_content = response.json()
            dtable_content = rebuild_content_asset(dtable_content, dst_dtable)
            # save content to local
            os.makedirs(cur_dtable_path)
            dtable_save_path = os.path.join(cur_dtable_path, dtable_file_name)
            with open(dtable_save_path, 'w') as f:
                json.dump(dtable_content, f)
            # upload content
            seafile_api.post_file(dst_workspace.repo_id, dtable_save_path, '/', dtable_file_name, username)
        else:
            seafile_api.post_empty_file(dst_workspace.repo_id, '/', dtable_file_name, username)
    except Exception as e:
        logger.error('copy dtable: %s.dtable file error: %s', name, e)
        DTables.objects.filter(id=dst_dtable.id).delete()
        error_msg = 'Internal Server Error'
        return None, api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
    finally:
        clear_tmp_files_and_dirs(str(dst_dtable.uuid))

    try:
        # asset dir by seafile_api.copy_file, sync-style temporary
        copy_asset(src_workspace.repo_id, src_dtable.uuid, dst_workspace.repo_id, dst_dtable.uuid, username)
    except Exception as e:
        logger.error('dtable: %s, copy asset dir error: %s', src_dtable.id, e)
        error_msg = 'Internal Server Error'
        DTables.objects.filter(id=dst_dtable.id).delete()
        if seafile_api.get_file_id_by_path(dst_workspace.repo_id, '/' + dtable_file_name):
            seafile_api.del_file(dst_workspace.repo_id, '/', dtable_file_name, username)
        return None, api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
    finally:
        clear_tmp_files_and_dirs(str(dst_dtable.uuid))

    return dst_dtable, None


class DTableCopyView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def post(self, request):
        # argument check
        try:
            src_workspace_id = int(request.data.get('src_workspace_id'))
            dst_workspace_id = int(request.data.get('dst_workspace_id'))
        except:
            error_msg = 'src_workspace_id or dst_workspace_id is invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        name = request.data.get('name')
        if not name:
            error_msg = 'name is invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # resource check
        src_workspace = Workspaces.objects.get_workspace_by_id(src_workspace_id)
        if not src_workspace:
            error_msg = 'workspace: %s not found' % src_workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        src_dtable = DTables.objects.get_dtable(src_workspace, name)
        if not src_dtable:
            error_msg = 'dtable: %s not found' % name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        dst_workspace = Workspaces.objects.get_workspace_by_id(dst_workspace_id)
        if not dst_workspace_id:
            error_msg = 'workspace: %s not found' % dst_workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        # must be dist workspace's owner or admin
        username = request.user.username
        if not check_dtable_permission(username, src_workspace, src_dtable) or \
            not check_dtable_admin_permission(username, dst_workspace.owner):
            error_msg = 'Permission denied'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # dtable-name check
        if DTables.objects.get_dtable(dst_workspace, name):
            error_msg = 'Table %s already exists in this workspace.' % (name)
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # create dtable
        dst_dtable, error = copy_dtable(src_workspace, src_dtable, dst_workspace, name, username)
        if error:
            return error

        return Response({'dtable': dst_dtable.to_dict()})


class DTableExternalLinkCopyView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def _check_link(self, link):
        # checkout token
        re_link = r'dtable/external-links/([0-9a-zA-Z]+)/$'
        matches = re.findall(re_link, link)
        if not matches:
            error_msg = 'link is invalid.'
            return None, api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        token = matches[0]
        # verify link
        try:
            resp = requests.get(link)
            if resp.status_code != 200:
                error_msg = 'link is invalid.'
                return None, api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        except:
            error_msg = 'link is invalid'
            return None, api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        return token, None

    def post(self, request):
        # arguments check
        link = request.data.get('link')
        if not link:
            error_msg = 'link is invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        dst_workspace_id = request.data.get('dst_workspace_id')
        if not dst_workspace_id:
            error_msg = 'dst_workspace_id is invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        
        # check link
        token, error = self._check_link(link)
        if error:
            return error

        # resource check
        dtable_external_link = DTableExternalLinks.objects.filter(token=token).select_related('dtable', 'dtable__workspace').first()
        if not dtable_external_link:
            error_msg = 'link %s not found.' % (link,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        if dtable_external_link.dtable.deleted:
            error_msg = 'link %s not found.' % (link,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        username = request.user.username
        # self workspace check
        dst_workspace = Workspaces.objects.filter(id=dst_workspace_id).first()
        if not dst_workspace:
            error_msg = 'workspace %s not found.' % (dst_workspace_id,)
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        if not check_dtable_admin_permission(username, dst_workspace.owner):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)
        if DTables.objects.filter(workspace=dst_workspace, name=dtable_external_link.dtable.name).exists():
            error_msg = 'Table %s already exists in this workspace.' % (dtable_external_link.dtable.name,)
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # copy
        dst_dtable, error = copy_dtable(dtable_external_link.dtable.workspace, dtable_external_link.dtable, dst_workspace, 
                                        dtable_external_link.dtable.name, username)
        if error:
            return error

        return Response({'dtable': dst_dtable.to_dict()})
