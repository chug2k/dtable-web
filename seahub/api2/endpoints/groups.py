# Copyright (c) 2012-2016 Seafile Ltd.
import logging

from django.utils.translation import ugettext as _
from django.template.defaultfilters import filesizeformat

from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

import seaserv
from seaserv import seafile_api, ccnet_api
from pysearpc import SearpcError

from seahub.api2.utils import api_error
from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.group.utils import refresh_group_name_cache
from seahub.avatar.settings import GROUP_AVATAR_DEFAULT_SIZE
from seahub.avatar.templatetags.group_avatar_tags import api_grp_avatar_url, \
    get_default_group_avatar_url
from seahub.utils import is_org_context, is_valid_username
from seahub.utils.repo import get_repo_owner
from seahub.utils.timeutils import timestamp_to_isoformat_timestr
from seahub.group.utils import validate_group_name, check_group_name_conflict, \
    is_group_member, is_group_admin, is_group_owner, is_group_admin_or_owner, \
    group_id_to_name
from seahub.group.views import remove_group_common
from seahub.base.templatetags.seahub_tags import email2nickname, \
    translate_seahub_time, email2contact_email
from seahub.dtable.utils import create_repo_and_workspace
from seahub.dtable.models import Workspaces, DTables

from .utils import api_check_group

logger = logging.getLogger(__name__)

def get_group_admins(group_id):
    members = seaserv.get_group_members(group_id)
    admin_members = [m for m in members if m.is_staff]

    admins = []
    for u in admin_members:
        admins.append(u.user_name)

    return admins

def get_group_info(request, group_id, avatar_size=GROUP_AVATAR_DEFAULT_SIZE):
    group = seaserv.get_group(group_id)
    try:
        avatar_url, is_default, date_uploaded = api_grp_avatar_url(group.id, avatar_size)
    except Exception as e:
        logger.error(e)
        avatar_url = get_default_group_avatar_url()

    isoformat_timestr = timestamp_to_isoformat_timestr(group.timestamp)
    group_info = {
        "id": group.id,
        "parent_group_id": group.parent_group_id,
        "name": group.group_name,
        "owner": group.creator_name,
        "created_at": isoformat_timestr,
        "avatar_url": request.build_absolute_uri(avatar_url),
        "admins": get_group_admins(group.id),
    }
    # parent_group_id = 0: non department group
    # parent_group_id = -1: top department group
    # parent_group_id = n(n > 0):  sub department group, n is parent group's id
    if group.parent_group_id != 0:
        group_info['group_quota'] = seafile_api.get_group_quota(group_id)
        group_info['group_quota_usage'] = seafile_api.get_group_quota_usage(group_id)

    return group_info


class Groups(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle, )

    def _can_add_group(self, request):
        return request.user.permissions.can_add_group()

    def get(self, request):
        """ List all groups.
        """

        org_id = None
        username = request.user.username
        if is_org_context(request):
            org_id = request.user.org.org_id
            user_groups = seaserv.get_org_groups_by_user(org_id, username)
        else:
            user_groups = ccnet_api.get_groups(username, return_ancestors=True)

        try:
            avatar_size = int(request.GET.get('avatar_size', GROUP_AVATAR_DEFAULT_SIZE))
        except ValueError:
            avatar_size = GROUP_AVATAR_DEFAULT_SIZE

        groups = []
        for g in user_groups:
            group_info = get_group_info(request, g.id, avatar_size)
            groups.append(group_info)

        return Response(groups)

    def post(self, request):
        """ Create a group
        """
        if not self._can_add_group(request):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        username = request.user.username
        group_name = request.data.get('name', '')
        group_name = group_name.strip()

        # Check whether group name is validate.
        if not validate_group_name(group_name):
            error_msg = _('Group name can only contain letters, numbers, blank, hyphen, dot, single quote or underscore')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # Check whether group name is duplicated.
        if check_group_name_conflict(request, group_name):
            error_msg = _('There is already a group with that name.')
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # create group.
        try:
            if is_org_context(request):
                org_id = request.user.org.org_id
                group_id = seaserv.ccnet_threaded_rpc.create_org_group(org_id,
                                                                       group_name,
                                                                       username)
            else:
                group_id = seaserv.ccnet_threaded_rpc.create_group(group_name,
                                                                   username)
        except SearpcError as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # if the group has no workspace, create a workspace
        owner = '%s@seafile_group' % group_id
        workspace = Workspaces.objects.get_workspace_by_owner(owner)
        if not workspace:
            try:
                org_id = -1
                if is_org_context(request):
                    org_id = request.user.org.org_id
                create_repo_and_workspace(owner, org_id)
            except Exception as e:
                logger.error(e)
                error_msg = 'Internal Server Error.'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # get info of new group
        group_info = get_group_info(request, group_id)

        return Response(group_info, status=status.HTTP_201_CREATED)


class Group(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle, )

    @api_check_group
    def get(self, request, group_id):
        """ Get info of a group.
        """

        try:
            # only group member can get info of a group
            if not is_group_member(group_id, request.user.username):
                error_msg = 'Permission denied.'
                return api_error(status.HTTP_403_FORBIDDEN, error_msg)
        except SearpcError as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        try:
            avatar_size = int(request.GET.get('avatar_size', GROUP_AVATAR_DEFAULT_SIZE))
        except ValueError:
            avatar_size = GROUP_AVATAR_DEFAULT_SIZE

        group_info = get_group_info(request, group_id, avatar_size)

        return Response(group_info)

    @api_check_group
    def put(self, request, group_id):
        """ Rename, transfer a specific group
        """

        username = request.user.username
        new_group_name = request.data.get('name', None)
        # rename a group
        # only group owner can rename a group
        if new_group_name:
            try:
                if not is_group_owner(group_id, username):
                    error_msg = 'Permission denied.'
                    return api_error(status.HTTP_403_FORBIDDEN, error_msg)

                # Check whether group name is validate.
                if not validate_group_name(new_group_name):
                    error_msg = _('Group name can only contain letters, numbers, blank, hyphen or underscore')
                    return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

                # Check whether group name is duplicated.
                if check_group_name_conflict(request, new_group_name):
                    error_msg = _('There is already a group with that name.')
                    return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

                seaserv.ccnet_threaded_rpc.set_group_name(group_id, new_group_name)

            except SearpcError as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

            refresh_group_name_cache(group_id, new_group_name)

        new_owner = request.data.get('owner', None)
        # transfer a group
        if new_owner:
            try:
                # only group owner can transfer a group
                if not is_group_owner(group_id, username):
                    error_msg = 'Permission denied.'
                    return api_error(status.HTTP_403_FORBIDDEN, error_msg)

                # augument check
                if not is_valid_username(new_owner):
                    error_msg = 'Email %s invalid.' % new_owner
                    return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

                if is_group_owner(group_id, new_owner):
                    error_msg = _('User %s is already group owner.') % new_owner
                    return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

                # transfer a group
                if not is_group_member(group_id, new_owner):
                    ccnet_api.group_add_member(group_id, username, new_owner)

                if not is_group_admin(group_id, new_owner):
                    ccnet_api.group_set_admin(group_id, new_owner)

                ccnet_api.set_group_creator(group_id, new_owner)
                ccnet_api.group_unset_admin(group_id, username)

            except SearpcError as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        wiki_enabled = request.data.get('wiki_enabled', None)
        # turn on/off group wiki
        if wiki_enabled:
            try:
                # only group owner/admin can turn on a group wiki
                if not is_group_admin_or_owner(group_id, username):
                    error_msg = 'Permission denied.'
                    return api_error(status.HTTP_403_FORBIDDEN, error_msg)

                # augument check
                if wiki_enabled != 'true' and wiki_enabled != 'false':
                    error_msg = 'wiki_enabled invalid.'
                    return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

                # turn on/off group wiki
                if wiki_enabled == 'true':
                    enable_mod_for_group(group_id, MOD_GROUP_WIKI)
                else:
                    disable_mod_for_group(group_id, MOD_GROUP_WIKI)

            except SearpcError as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        group_info = get_group_info(request, group_id)

        return Response(group_info)

    @api_check_group
    def delete(self, request, group_id):
        """ Dismiss a specific group

        Permission:
        1. group owner
        """
        org_id = None
        if is_org_context(request):
            org_id = request.user.org.org_id

        username = request.user.username

        try:
            # only group owner can dismiss a group
            if not is_group_owner(group_id, username):
                error_msg = 'Permission denied.'
                return api_error(status.HTTP_403_FORBIDDEN, error_msg)
        except SearpcError as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # if there are dtables in this group, prohibit deletion of groups
        owner = '%s@seafile_group' % group_id
        workspace = Workspaces.objects.get_workspace_by_owner(owner)
        if DTables.objects.filter(workspace=workspace, deleted=False).exists():
            error_msg = 'Disable group deletion before deleting table(s).'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        try:
            seafile_api.remove_repo(workspace.repo_id)
            workspace.delete()
            remove_group_common(group_id, username, org_id=org_id)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True})
