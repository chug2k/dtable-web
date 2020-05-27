# Copyright (c) 2012-2016 Seafile Ltd.
import logging

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication

from seaserv import ccnet_api, seafile_api

from seahub.constants import ORG_DEFAULT
from seahub.dtable.models import Workspaces
from seahub.role_permissions.utils import get_enabled_role_permissions_by_role
from seahub.utils.file_size import get_quota_from_string

from seahub.api2.permissions import IsProVersion
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.authentication import TokenAuthentication
from seahub.api2.utils import api_error

from seahub.organizations.models import OrgMemberQuota, OrgSettings
from seahub.organizations.settings import ORG_MEMBER_QUOTA_ENABLED
from seahub.organizations.permissions import IsOrgAdmin

logger = logging.getLogger(__name__)

class OrgAdminInfo(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsProVersion, IsOrgAdmin)

    def get(self, request):
        """Get info of an organization
        """

        org = request.user.org
        org_id = org.org_id

        # space quota
        org_role = OrgSettings.objects.filter(org_id=org_id).first()
        org_role = org_role.role if org_role else ORG_DEFAULT
        storage_quota = get_enabled_role_permissions_by_role(org_role).get('role_asset_quota', '')
        storage_quota = get_quota_from_string(storage_quota) if storage_quota else -2

        storage_usage = Workspaces.objects.get_org_total_storage(org_id)

        # member quota
        if ORG_MEMBER_QUOTA_ENABLED:
            member_quota = OrgMemberQuota.objects.get_quota(org_id)
        else:
            member_quota = None

        # member usage
        try:
            url_prefix = request.user.org.url_prefix
            org_members = ccnet_api.get_org_emailusers(url_prefix, -1, -1)
        except Exception as e:
            logger.error(e)
            org_members = []

        member_usage = 0
        active_members = 0
        if org_members:
            member_usage = len(org_members)
            active_members = len([m for m in org_members if m.is_active])

        info = {}
        info['org_id'] = org_id
        info['org_name'] = org.org_name
        info['storage_quota'] = storage_quota
        info['storage_usage'] = storage_usage
        info['member_quota'] = member_quota
        info['member_usage'] = member_usage
        info['active_members'] = active_members

        return Response(info)

    def put(self, request):
        org = request.user.org
        org_id = org.org_id

        new_org_name = request.data.get('new_org_name')
        if new_org_name:
            try:
                ccnet_api.set_org_name(org_id, new_org_name)
            except Exception as e:
                logger.error('set org_id: %s new_org_name: %s error: %s', org_id, new_org_name, e)
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error.')


        return Response({'success': True})
