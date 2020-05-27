# Copyright (c) 2012-2016 Seafile Ltd.
from copy import deepcopy
import logging

from django.conf import settings
from seahub.constants import DEFAULT_USER, GUEST_USER, \
    DEFAULT_ADMIN, SYSTEM_ADMIN, DAILY_ADMIN, AUDIT_ADMIN, ORG_DEFAULT

# Get an instance of a logger
logger = logging.getLogger(__name__)

def merge_roles(default, custom):
    """Merge custom dict into the copy of default dict, and return the copy."""
    copy = deepcopy(default)
    for role in custom:
        if role in default:
            copy[role].update(custom[role])
        else:
            default_role_copy = default['default'].copy()
            default_role_copy.update(custom[role])
            copy[role] = default_role_copy

    return copy

DEFAULT_ENABLED_ROLE_PERMISSIONS = {
    DEFAULT_USER: {
        'can_add_dtable': True,
        'can_add_group': True,
        'can_use_global_address_book': True,
        'can_generate_share_link': True,
        'can_invite_guest': False,
        'role_quota': '',
        'role_asset_quota': '',
        'can_create_common_dataset': True,
        'can_generate_external_link': True,
    },
    GUEST_USER: {
        'can_add_dtable': False,
        'can_add_group': False,
        'can_use_global_address_book': False,
        'can_generate_share_link': False,
        'role_quota': '',
        'role_asset_quota': ''
    },
    ORG_DEFAULT: {
        'can_add_dtable': True,
        'can_add_group': True,
        'role_asset_quota': ''
    }
}

try:
    custom_role_permissions = settings.ENABLED_ROLE_PERMISSIONS
except AttributeError:
    custom_role_permissions = {}

ENABLED_ROLE_PERMISSIONS = merge_roles(
    DEFAULT_ENABLED_ROLE_PERMISSIONS, custom_role_permissions
)

# role permission for administraror

# 1, Admin without a role or with a role of `default_admin` can view ALL pages.
# 2, If an admin has a role:
#  2.1, He/she can NOT view any pages by default.
#  2.2, If he/she wants to view some page, set the related permission to `True`.
#  2.3, He/she can only view the following pages(defined by `ALL_ADMIN_PERMISSIONS`) at most.

DEFAULT_ENABLED_ADMIN_ROLE_PERMISSIONS = {
    DEFAULT_ADMIN: {
        'can_view_system_info': True,
        'can_view_statistic': True,
        'can_config_system': True,
        'can_manage_library': True,
        'can_manage_user': True,
        'can_manage_group': True,
        'can_manage_external_link': True,
        'can_view_user_log': True,
        'can_view_admin_log': True,
    },
    # SYSTEM_ADMIN can ONLY view system-info(without upload licence), settings pages.
    SYSTEM_ADMIN: {
        'can_view_system_info': True,
        'can_config_system': True,
    },
    # DAILY_ADMIN can ONLY view system-info(without upload licence), statistic,
    # libraries, users(except 'Admins'), groups, user-logs pages.
    DAILY_ADMIN: {
        'can_view_system_info': True,
        'can_view_statistic': True,
        'can_manage_library': True,
        'can_manage_user': True,
        'can_manage_group': True,
        'can_view_user_log': True,
    },
    # AUDIT_ADMIN can ONLY view system-info(without upload licence), admin-logs pages.
    AUDIT_ADMIN: {
        'can_view_system_info': True,
        'can_view_admin_log': True,
    },
}

admin_role_permissions = DEFAULT_ENABLED_ADMIN_ROLE_PERMISSIONS.copy()

try:
    admin_role_permissions.update(settings.ENABLED_ADMIN_ROLE_PERMISSIONS)  # merge outter dict
except AttributeError:
    pass  # ignore error if ENABLED_ADMIN_ROLE_PERMISSIONS is not set in settings.py

def get_enabled_admin_role_permissions():
    permissions = {}
    for role, perms in admin_role_permissions.items():
        # check admin role permission syntax
        default_admin_permissions = DEFAULT_ENABLED_ADMIN_ROLE_PERMISSIONS[DEFAULT_ADMIN]
        for k in list(perms.keys()):
            if k not in list(default_admin_permissions.keys()):
                logger.warn('"%s" is not valid permission, please review the ENABLED_ADMIN_ROLE_PERMISSIONS setting.' % k)

        all_false_permission = {}
        for permission in list(default_admin_permissions.keys()):
            all_false_permission[permission] = False

        all_false_permission.update(perms)
        permissions[role] = all_false_permission

    return permissions

ENABLED_ADMIN_ROLE_PERMISSIONS = get_enabled_admin_role_permissions()
