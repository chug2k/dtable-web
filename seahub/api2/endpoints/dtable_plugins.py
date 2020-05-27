import os
import logging
import json
import shutil
import requests
from zipfile import ZipFile, is_zipfile
from datetime import datetime

from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils.translation import ugettext as _
from django.core.files.uploadhandler import TemporaryFileUploadHandler
from seaserv import seafile_api, ccnet_api

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.dtable.models import Workspaces, DTables, DTablePlugins
from seahub.dtable.utils import check_dtable_permission, check_dtable_admin_permission
from seahub.utils import rreplace, CsrfExemptSessionAuthentication
from seahub.settings import SEATABLE_MARKET_URL

logger = logging.getLogger(__name__)

TMP_EXTRACTED_PATH = '/tmp/dtable_plugin/'
INFO_FILE_NAME = 'info.json'
MAINJS_FILE_NAME = 'main.js'


def create_plugin_asset_files(repo_id, username, plugin_name, plugin_path, folder_path):
    for root, dirs, files in os.walk(TMP_EXTRACTED_PATH):
        for file_name in files:
            inner_path = root[len(TMP_EXTRACTED_PATH):]  # path inside plugin zip
            tmp_file_path = os.path.join(root, file_name)
            cur_file_parent_path = os.path.join(plugin_path, plugin_name, inner_path, '')

            # check zip of a folder
            if folder_path:
                cur_file_parent_path = rreplace(cur_file_parent_path, folder_path + '/', '', 1)

            # check current file's parent path before post file
            path_id = seafile_api.get_dir_id_by_path(repo_id, cur_file_parent_path)
            if not path_id:
                seafile_api.mkdir_with_parents(repo_id, '/', cur_file_parent_path[1:], username)

            seafile_api.post_file(repo_id, tmp_file_path, cur_file_parent_path, file_name, username)


def delete_plugin_asset_folder(repo_id, username, plugin_file_path):
    parent_dir = os.path.dirname(plugin_file_path)
    file_name = os.path.basename(plugin_file_path)
    seafile_api.del_file(repo_id, parent_dir, file_name, username)


def get_folder_path(namelist):
    """
         folder_path is aimed to check zip of a folder, e.g.

         xxx.zip
               |- some_folder_name
                                |- info.json
                                |- main.js

         if dir tree is like above, then folder_path = some_folder_name
    """
    if INFO_FILE_NAME not in namelist:
        for path in namelist:
            if INFO_FILE_NAME in path and len(path.split('/')[:-1]) == 1:
                return ''.join(path.split('/')[:-1])
    return ''


class DTablePluginsView(APIView):
    authentication_classes = (TokenAuthentication, CsrfExemptSessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, workspace_id, name):
        """ list uploaded plugins in a dtable
        """

        table_name = name
        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'DTable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        username = request.user.username
        permission = check_dtable_permission(username, workspace, dtable)
        if not permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        plugins = DTablePlugins.objects.filter(dtable=dtable)
        return Response({'plugin_list': [plugin.to_dict() for plugin in plugins]})

    def post(self, request, workspace_id, name):
        """ upload a plugin *.zip file
            1. check params, perms and resources
            2. read info from zip file, and extract zip in TMP_EXTRACTED_PATH
            3. create file in asset dir, and delete TMP_EXTRACTED_PATH
            4. record in database

            There are two tmp files in this api.
            First is django upload tmp file, it will be removed automatically.
            Second is extracted folder 'TMP_EXTRACTED_PATH', we removed it manually.

            permission: workspace owner or admin
        """

        # use TemporaryFileUploadHandler, which contains TemporaryUploadedFile
        # TemporaryUploadedFile has temporary_file_path() method
        # in order to change upload_handlers, we must exempt csrf check
        request.upload_handlers = [TemporaryFileUploadHandler(request=request)]

        table_name = name
        from_market = request.data.get('from_market', 'false').lower()

        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        if '@seafile_group' in workspace.owner:
            group_id = workspace.owner.split('@')[0]
            group = ccnet_api.get_group(int(group_id))
            if not group:
                error_msg = 'Group %s not found.' % group_id
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'DTable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        permission = check_dtable_admin_permission(username, workspace.owner)
        if not permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)


        if from_market not in ['true', 'false']:
            # from_market invalid
            error_msg = 'from_market invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if from_market == 'true':
            """
            if we add plugin from market
            1. get plugin_download_url from market by plugin_name
            2. download plugin zip by plugin_download_url
            3. extract zip in TMP_EXTRACTED_PATH
            4. create file in asset dir, and delete TMP_EXTRACTED_PATH
            5. record in database
            """
            plugin_name = request.data.get('plugin_name', '')
            if not plugin_name:
                error_msg = 'plugin_name invalid.'
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            if DTablePlugins.objects.filter(name=plugin_name, dtable=dtable).count() > 0:
                error_msg = _('Plugin with name %s is already in dtable %s.') % (plugin_name, dtable.name)
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            # get plugin_download_url from market by plugin_name
            # download plugin zip by plugin_download_url
            seamarket_plugin_api_url = SEATABLE_MARKET_URL.rstrip('/') + '/api/plugins/' + plugin_name + '/'
            res = requests.get(seamarket_plugin_api_url)
            download_url = json.loads(res.content).get('download_url', '')

            if not download_url:
                error_msg = 'plugin %s not found.' % plugin_name
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)

            plugin_zip_file_response = requests.get(download_url)

            os.mkdir('/tmp/plugin_download_from_market')
            tmp_zip_path = '/tmp/plugin_download_from_market/plugin_zip'
            with open(tmp_zip_path, 'wb') as f:
                f.write(plugin_zip_file_response.content)

            # extract zip in TMP_EXTRACTED_PATH
            with ZipFile(tmp_zip_path, 'r') as zip_file:
                folder_path = get_folder_path(zip_file.namelist())
                try:
                    info_json_str = zip_file.read(os.path.join(folder_path, INFO_FILE_NAME))
                except Exception:
                    error_msg = _('"info.json" not found.')
                    return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
                zip_file.extractall(TMP_EXTRACTED_PATH)

            shutil.rmtree('/tmp/plugin_download_from_market')

            # create file in asset dir, and delete TMP_EXTRACTED_PATH
            # if no plugins path, create it
            plugin_path = '/asset/' + str(dtable.uuid) + '/plugins/'
            plugin_path_id = seafile_api.get_dir_id_by_path(repo_id, plugin_path)
            if not plugin_path_id:
                try:
                    seafile_api.mkdir_with_parents(repo_id, '/', plugin_path[1:], username)
                except Exception as e:
                    logger.error(e)
                    error_msg = 'Internal Server Error'
                    return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

            # if asset dir has plugin with same name, we replace old with new
            if seafile_api.get_dir_id_by_path(repo_id, os.path.join(plugin_path, plugin_name)):
                delete_plugin_asset_folder(repo_id, username, os.path.join(plugin_path, plugin_name))

            # create path and file
            try:
                create_plugin_asset_files(repo_id, username, plugin_name, plugin_path, folder_path)
            except Exception as e:
                logger.error(e)
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

            # remove extracted tmp file
            shutil.rmtree(TMP_EXTRACTED_PATH)

            # 4. record in database
            plugin_record = DTablePlugins.objects.create(
                dtable=dtable,
                added_by=username,
                added_time=datetime.now(),
                name=plugin_name,
                info=info_json_str
            )

            return Response(plugin_record.to_dict())

        # 1. check params
        plugin_file = request.FILES.get('plugin', None)
        if not plugin_file:
            error_msg = 'plugin invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if plugin_file.size >> 20 > 300:
            error_msg = _('File is too large.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # 2. read info from zip file, and extract zip in TMP_EXTRACTED_PATH
        uploaded_temp_path = plugin_file.temporary_file_path()
        if not is_zipfile(uploaded_temp_path):
            error_msg = _('A zip file is required.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        with ZipFile(uploaded_temp_path, 'r') as zip_file:
            folder_path = get_folder_path(zip_file.namelist())
            try:
                info_json_str = zip_file.read(os.path.join(folder_path, INFO_FILE_NAME))
                info = json.loads(info_json_str)
            except Exception:
                error_msg = _('"info.json" not found.')
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            try:
                zip_file.read(os.path.join(folder_path, MAINJS_FILE_NAME))
            except Exception:
                error_msg = _('"main.js" not found.')
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
            plugin_name = info.get('name', '')
            zip_file.extractall(TMP_EXTRACTED_PATH)

        if DTablePlugins.objects.filter(name=plugin_name, dtable=dtable).count() > 0:
            error_msg = _('Plugin with name %s is already in dtable %s.') % (plugin_name, dtable.name)
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # 3. create file in asset dir, and delete TMP_EXTRACTED_PATH
        # if no plugins path, create it
        plugin_path = '/asset/' + str(dtable.uuid) + '/plugins/'
        plugin_path_id = seafile_api.get_dir_id_by_path(repo_id, plugin_path)
        if not plugin_path_id:
            try:
                seafile_api.mkdir_with_parents(repo_id, '/', plugin_path[1:], username)
            except Exception as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # if asset dir has plugin with same name, we replace old with new
        if seafile_api.get_dir_id_by_path(repo_id, os.path.join(plugin_path, plugin_name)):
            delete_plugin_asset_folder(repo_id, username, os.path.join(plugin_path, plugin_name))

        # create path and file
        try:
            create_plugin_asset_files(repo_id, username, plugin_name, plugin_path, folder_path)
        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        # remove extracted tmp file
        shutil.rmtree(TMP_EXTRACTED_PATH)

        # 4. record in database
        plugin_record = DTablePlugins.objects.create(
            dtable=dtable,
            added_by=username,
            added_time=datetime.now(),
            name=plugin_name,
            info=info_json_str
        )

        return Response(plugin_record.to_dict())


class DTablePluginView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def put(self, request, workspace_id, name, plugin_id):
        """ update a plugin
            1. check params, perms and resources
            2. read new plugin file, read its info.json
            3. delete old asset file, replace with new asset file
            4. update database record

            permission: dtable admin
        """
        request.upload_handlers = [TemporaryFileUploadHandler(request=request)]

        # 1. check params, perms and resources
        try:
            plugin_record = DTablePlugins.objects.get(pk=plugin_id)
        except DTablePlugins.DoesNotExist:
            error_msg = 'Plugin %s not found.' % plugin_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        if '@seafile_group' in workspace.owner:
            group_id = workspace.owner.split('@')[0]
            group = ccnet_api.get_group(int(group_id))
            if not group:
                error_msg = 'Group %s not found.' % group_id
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        table_name = name
        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'DTable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        permission = check_dtable_admin_permission(username, workspace.owner)
        if not permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        plugin_file_path = '/asset/' + str(dtable.uuid) + '/plugins/' + plugin_record.name
        plugin_file_dir_id = seafile_api.get_dir_id_by_path(repo_id, plugin_file_path)
        if not plugin_file_dir_id:
            error_msg = 'Plugin %s not found.' % plugin_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        plugin_file = request.FILES.get('plugin', None)
        if not plugin_file:
            error_msg = 'plugin invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if plugin_file.size >> 20 > 300:
            error_msg = _('File is too large.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        uploaded_temp_path = plugin_file.temporary_file_path()
        if not is_zipfile(uploaded_temp_path):
            error_msg = _('A zip file is required.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # read from zip
        with ZipFile(uploaded_temp_path, 'r') as zip_file:
            folder_path = get_folder_path(zip_file.namelist())
            try:
                info_json_str = zip_file.read(os.path.join(folder_path, INFO_FILE_NAME))
                info = json.loads(info_json_str)
            except Exception:
                error_msg = _('"info.json" not found.')
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            try:
                zip_file.read(os.path.join(folder_path, MAINJS_FILE_NAME))
            except Exception:
                error_msg = _('"main.js" not found.')
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
            new_plugin_name = info.get('name', '')
            zip_file.extractall(TMP_EXTRACTED_PATH)

        plugin_path = '/asset/' + str(dtable.uuid) + '/plugins/'

        # if new_plugin_name == old plugin name, no need to check name
        if new_plugin_name != plugin_record.name:
            if DTablePlugins.objects.filter(name=new_plugin_name, dtable=dtable).count() > 0:
                error_msg = _('Plugin with name %s is already in dtable %s.') % (new_plugin_name, dtable.name)
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            # check if duplicate plugin name within a dtable asset
            if seafile_api.get_dir_id_by_path(repo_id, os.path.join(plugin_path, new_plugin_name)):
                error_msg = _('Plugin with name %s is already in dtable %s.') % (new_plugin_name, dtable.name)
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # delete old asset file
        try:
            delete_plugin_asset_folder(repo_id, username, plugin_file_path)
        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        # create file in asset dir, and delete TMP_EXTRACTED_PATH
        try:
            create_plugin_asset_files(repo_id, username, new_plugin_name, plugin_path, folder_path)
        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        shutil.rmtree(TMP_EXTRACTED_PATH)

        # 4. update record in database
        plugin_record.name = new_plugin_name
        plugin_record.info = info_json_str
        plugin_record.save()

        return Response(plugin_record.to_dict())

    def delete(self, request, workspace_id, name, plugin_id):
        """ delete a plugin file
            1. check params, perms and resources
            2. delete asset file
            3. delete record in database

            permission: dtable admin
        """

        # 1. check params, perms and resources
        try:
            plugin_record = DTablePlugins.objects.get(pk=plugin_id)
        except DTablePlugins.DoesNotExist:
            error_msg = 'Plugin %s not found.' % plugin_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        workspace = Workspaces.objects.get_workspace_by_id(workspace_id)
        if not workspace:
            error_msg = 'Workspace %s not found.' % workspace_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        if '@seafile_group' in workspace.owner:
            group_id = workspace.owner.split('@')[0]
            group = ccnet_api.get_group(int(group_id))
            if not group:
                error_msg = 'Group %s not found.' % group_id
                return api_error(status.HTTP_404_NOT_FOUND, error_msg)
        table_name = name
        dtable = DTables.objects.get_dtable(workspace, table_name)
        if not dtable:
            error_msg = 'DTable %s not found.' % table_name
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # permission check
        username = request.user.username
        permission = check_dtable_admin_permission(username, workspace.owner)
        if not permission:
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            error_msg = 'Library %s not found.' % repo_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        plugin_file_path = '/asset/' + str(dtable.uuid) + '/plugins/' + plugin_record.name
        plugin_file_dir_id = seafile_api.get_dir_id_by_path(repo_id, plugin_file_path)
        if not plugin_file_dir_id:
            error_msg = 'Plugin %s not found.' % plugin_id
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        try:
            delete_plugin_asset_folder(repo_id, username, plugin_file_path)
        except Exception as e:
            logger.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        plugin_record.delete()

        return Response({'success': True})
