# Copyright (c) 2012-2016 Seafile Ltd.
import logging

from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from seaserv import seafile_api, ccnet_api
from pysearpc import SearpcError

from seahub import settings
from seahub.utils import is_pro_version
from seahub.utils.licenseparse import parse_license

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.models import TokenV2
from seahub.api2.endpoints.admin.utils import get_dtable_server_info
from seahub.dtable.models import DTables

try:
    from seahub.settings import MULTI_TENANCY
except ImportError:
    MULTI_TENANCY = False

SEATABLE_VERSION = getattr(settings, 'SEATABLE_VERSION', 'Dev')
logger = logging.getLogger(__name__)

class SysInfo(APIView):
    """Show system info.
    """
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsAdminUser,)

    def get(self, request, format=None):
        # count groups
        try:
            groups_count = len(ccnet_api.get_all_groups(-1, -1))
        except Exception as e:
            logger.error(e)
            groups_count = 0

        # count orgs
        if MULTI_TENANCY:
            multi_tenancy_enabled = True
            try:
                org_count = ccnet_api.count_orgs()
            except Exception as e:
                logger.error(e)
                org_count = 0
        else:
            multi_tenancy_enabled = False
            org_count = 0

        # count users
        try:
            active_db_users = ccnet_api.count_emailusers('DB')
        except Exception as e:
            logger.error(e)
            active_db_users = 0

        try:
            active_ldap_users = ccnet_api.count_emailusers('LDAP')
        except Exception as e:
            logger.error(e)
            active_ldap_users = 0

        try:
            inactive_db_users = ccnet_api.count_inactive_emailusers('DB')
        except Exception as e:
            logger.error(e)
            inactive_db_users = 0

        try:
            inactive_ldap_users = ccnet_api.count_inactive_emailusers('LDAP')
        except Exception as e:
            logger.error(e)
            inactive_ldap_users = 0

        active_users = active_db_users + active_ldap_users if \
            active_ldap_users > 0 else active_db_users

        inactive_users = inactive_db_users + inactive_ldap_users if \
            inactive_ldap_users > 0 else inactive_db_users

        # get license info
        is_pro = is_pro_version()
        if is_pro:
            license_dict = parse_license()
        else:
            license_dict = {}

        if license_dict:
            with_license = True
            try:
                max_users = int(license_dict.get('MaxUsers', 3))
            except ValueError as e:
                logger.error(e)
                max_users = 0
        else:
            with_license = False
            max_users = 0

        # count dtables
        try:
            dtables_count = DTables.objects.count()
        except Exception as e:
            logger.error(e)
            dtables_count = 0

        info = {
            'version': SEATABLE_VERSION,
            'users_count': active_users + inactive_users,
            'active_users_count': active_users,
            'groups_count': groups_count,
            'org_count': org_count,
            'dtables_count': dtables_count,
            'multi_tenancy_enabled': multi_tenancy_enabled,
            'is_pro': is_pro,
            'with_license': with_license,
            'license_expiration': license_dict.get('Expiration', ''),
            'license_mode': license_dict.get('Mode', ''),
            'license_maxusers': max_users,
            'license_to': license_dict.get('Name', ''),
            'dtable_server_info': get_dtable_server_info(request.user.username) or {}
        }

        return Response(info)
