# Copyright (c) 2012-2016 Seafile Ltd.
# encoding: utf-8

import os
from io import BytesIO
from types import FunctionType
import logging
import json
import re
import datetime
import time
from constance import config
from openpyxl import load_workbook

from django.db.models import Q
from django.conf import settings as dj_settings
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.http import HttpResponse, Http404, HttpResponseRedirect, HttpResponseNotAllowed
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.utils.translation import ugettext as _
from django.utils.http import urlquote

import seaserv
from seaserv import ccnet_threaded_rpc, seafserv_threaded_rpc, \
    seafile_api, get_group, get_group_members, ccnet_api, \
    get_related_users_by_org_repo
from pysearpc import SearpcError

from seahub.base.accounts import User
from seahub.base.models import UserLastLogin
from seahub.base.decorators import sys_staff_required, require_POST
from seahub.base.sudo_mode import update_sudo_mode_ts
from seahub.base.templatetags.seahub_tags import tsstr_sec, email2nickname, \
    email2contact_email
from seahub.auth import authenticate
from seahub.auth.decorators import login_required, login_required_ajax
from seahub.constants import GUEST_USER, DEFAULT_USER, DEFAULT_ADMIN, \
        SYSTEM_ADMIN, DAILY_ADMIN, AUDIT_ADMIN, HASH_URLS
from seahub.institutions.models import (Institution, InstitutionAdmin,
                                        InstitutionQuota)
from seahub.institutions.utils import get_institution_space_usage
from seahub.invitations.models import Invitation
from seahub.role_permissions.utils import get_available_roles, \
        get_available_admin_roles
from seahub.role_permissions.models import AdminRole
from seahub.two_factor.models import default_device
from seahub.utils import IS_EMAIL_CONFIGURED, string2list, is_valid_username, \
    is_pro_version, send_html_email, \
    get_server_id, get_max_upload_file_size, \
    get_site_name
from seahub.utils.ip import get_remote_ip
from seahub.utils.file_size import get_file_size_unit
from seahub.utils.ldap import get_ldap_info
from seahub.utils.licenseparse import parse_license, user_number_over_limit
from seahub.utils.rpc import mute_seafile_api
from seahub.utils.sysinfo import get_platform_name
from seahub.utils.mail import send_html_email_with_dj_template
from seahub.utils.ms_excel import write_xls
from seahub.utils.user_permissions import get_basic_user_roles, \
        get_user_role, get_basic_admin_roles
from seahub.utils.auth import get_login_bg_image_path
from seahub.utils.repo import get_related_users_by_repo, get_repo_owner
from seahub.views import get_system_default_repo_id
from seahub.forms import SetUserQuotaForm, AddUserForm, BatchAddUserForm, \
    TermsAndConditionsForm
from seahub.options.models import UserOptions
from seahub.profile.models import Profile
from seahub.signals import repo_deleted, institution_deleted
from seahub.admin_log.signals import admin_operation
from seahub.admin_log.models import USER_DELETE, USER_ADD
import seahub.settings as settings
from seahub.settings import INIT_PASSWD, SITE_ROOT, \
    SEND_EMAIL_ON_ADDING_SYSTEM_MEMBER, SEND_EMAIL_ON_RESETTING_USER_PASSWD, \
    ENABLE_GUEST_INVITATION
try:
    from seahub.settings import ENABLE_TRIAL_ACCOUNT
except:
    ENABLE_TRIAL_ACCOUNT = False
if ENABLE_TRIAL_ACCOUNT:
    from seahub_extra.trialaccount.models import TrialAccount
try:
    from seahub.settings import MULTI_TENANCY
    from seahub.organizations.models import OrgSettings
except ImportError:
    MULTI_TENANCY = False
try:
    from seahub.settings import ENABLE_SYSADMIN_EXTRA
except ImportError:
    ENABLE_SYSADMIN_EXTRA = False
from seahub.utils.two_factor_auth import has_two_factor_auth
from termsandconditions.models import TermsAndConditions
from seahub.work_weixin.settings import ENABLE_WORK_WEIXIN


logger = logging.getLogger(__name__)


@login_required
@sys_staff_required
def sysadmin_react_fake_view(request, **kwargs):

    try:
        expire_days = seafile_api.get_server_config_int('library_trash', 'expire_days')
    except Exception as e:
        logger.error(e)
        expire_days = -1

    return render(request, 'sysadmin/sysadmin_react_app.html', {
        'constance_enabled': dj_settings.CONSTANCE_ENABLED,
        'multi_tenancy': MULTI_TENANCY,
        'multi_institution': getattr(dj_settings, 'MULTI_INSTITUTION', False),
        'send_email_on_adding_system_member': SEND_EMAIL_ON_ADDING_SYSTEM_MEMBER,
        'sysadmin_extra_enabled': ENABLE_SYSADMIN_EXTRA,
        'enable_guest_invitation': ENABLE_GUEST_INVITATION,
        'enable_terms_and_conditions': config.ENABLE_TERMS_AND_CONDITIONS,
        'enable_work_weixin': ENABLE_WORK_WEIXIN,
        'trash_repos_expire_days': expire_days if expire_days > 0 else 30,
        'available_roles': get_available_roles(),
        'available_admin_roles': get_available_admin_roles()
    })

@login_required
@sys_staff_required
def sys_statistic_file(request):

    return render(request, 'sysadmin/sys_statistic_file.html', {
            })

@login_required
@sys_staff_required
def sys_statistic_storage(request):

    return render(request, 'sysadmin/sys_statistic_storage.html', {
            })

@login_required
@sys_staff_required
def sys_statistic_user(request):

    return render(request, 'sysadmin/sys_statistic_user.html', {
            })


@login_required
@sys_staff_required
def sys_statistic_reports(request):

    return render(request, 'sysadmin/sys_statistic_reports.html', {
            })

def can_view_sys_admin_repo(repo):
    default_repo_id = get_system_default_repo_id()
    is_default_repo = True if repo.id == default_repo_id else False

    if is_default_repo:
        return True
    elif repo.encrypted:
        return False
    elif is_pro_version():
        return True
    else:
        return False

def populate_user_info(user):
    """Populate contact email and name to user.
    """
    user.contact_email = email2contact_email(user.email)
    user.name = email2nickname(user.email)

def _populate_user_quota_usage(user):
    """Populate space/share quota to user.

    Arguments:
    - `user`:
    """
    orgs = ccnet_api.get_orgs_by_user(user.email)
    try:
        if orgs:
            user.org = orgs[0]
            org_id = user.org.org_id
            user.space_usage = seafile_api.get_org_user_quota_usage(org_id, user.email)
            user.space_quota = seafile_api.get_org_user_quota(org_id, user.email)
        else:
            user.space_usage = seafile_api.get_user_self_usage(user.email)
            user.space_quota = seafile_api.get_user_quota(user.email)
    except SearpcError as e:
        logger.error(e)
        user.space_usage = -1
        user.space_quota = -1



def email_user_on_activation(user):
    """Send an email to user when admin activate his/her account.
    """
    send_to = user.username
    profile = Profile.objects.get_profile_by_user(user.username)
    if profile and profile.contact_email:
        send_to = profile.contact_email

    c = {
        'username': send_to,
        }
    send_html_email(_('Your account on %s is activated') % get_site_name(),
            'sysadmin/user_activation_email.html', c, None, [send_to])


def send_user_reset_email(request, email, password):
    """
    Send email when reset user password.
    """

    c = {
        'email': email,
        'password': password,
        }
    send_html_email(_('Password has been reset on %s') % get_site_name(),
            'sysadmin/user_reset_email.html', c, None, [email])

def send_user_add_mail(request, email, password):
    """Send email when add new user."""
    c = {
        'user': request.user.username,
        'org': request.user.org,
        'email': email,
        'password': password,
        }
    send_html_email(_('You are invited to join %s') % get_site_name(),
            'sysadmin/user_add_email.html', c, None, [email])

def sys_get_org_base_info(org_id):

    org = ccnet_threaded_rpc.get_org_by_id(org_id)

    # users
    users = ccnet_threaded_rpc.get_org_emailusers(org.url_prefix, -1, -1)
    users_count = len(users)

    # groups
    groups = ccnet_threaded_rpc.get_org_groups(org_id, -1, -1)
    groups_count = len(groups)

    # quota
    total_quota = seafserv_threaded_rpc.get_org_quota(org_id)
    quota_usage = seafserv_threaded_rpc.get_org_quota_usage(org_id)

    return {
            "org": org,
            "users": users,
            "users_count": users_count,
            "groups": groups,
            "groups_count": groups_count,
            "total_quota": total_quota,
            "quota_usage": quota_usage,
           }


@login_required
def sys_sudo_mode(request):
    if request.method not in ('GET', 'POST'):
        return HttpResponseNotAllowed

    # here we can't use @sys_staff_required
    if not request.user.is_staff:
        raise Http404

    next_page = request.GET.get('next', reverse('sys_info'))
    password_error = False
    if request.method == 'POST':
        password = request.POST.get('password')
        username = request.user.username
        ip = get_remote_ip(request)
        if password:
            user = authenticate(username=username, password=password)
            if user:
                update_sudo_mode_ts(request)

                from seahub.auth.utils import clear_login_failed_attempts
                clear_login_failed_attempts(request, username)

                return HttpResponseRedirect(next_page)
        password_error = True

        from seahub.auth.utils import get_login_failed_attempts, incr_login_failed_attempts
        failed_attempt = get_login_failed_attempts(username=username, ip=ip)
        if failed_attempt >= config.LOGIN_ATTEMPT_LIMIT:
            # logout user
            from seahub.auth import logout
            logout(request)
            return HttpResponseRedirect(reverse('auth_login'))
        else:
            incr_login_failed_attempts(username=username, ip=ip)

    enable_shib_login = getattr(settings, 'ENABLE_SHIB_LOGIN', False)
    enable_adfs_login = getattr(settings, 'ENABLE_ADFS_LOGIN', False)
    return render(request,
        'sysadmin/sudo_mode.html', {
            'password_error': password_error,
            'enable_sso': enable_shib_login or enable_adfs_login,
            'next': next_page,
        })

@login_required
@sys_staff_required
def sys_useradmin_export_excel(request):
    """ Export all users from database to excel
    """

    next_page = request.META.get('HTTP_REFERER', None)
    if not next_page:
        next_page = SITE_ROOT

    try:
        users = ccnet_api.get_emailusers('DB', -1, -1) + \
                ccnet_api.get_emailusers('LDAPImport', -1, -1)
    except Exception as e:
        logger.error(e)
        messages.error(request, _('Failed to export Excel'))
        return HttpResponseRedirect(next_page)

    if is_pro_version():
        is_pro = True
    else:
        is_pro = False

    if is_pro:
        head = [_("Email"), _("Name"), _("Contact Email"), _("Status"), _("Role"),
                _("Space Usage") + "(MB)", _("Space Quota") + "(MB)",
                _("Create At"), _("Last Login"), _("Admin"), _("LDAP(imported)"),]
    else:
        head = [_("Email"), _("Name"), _("Contact Email"), _("Status"),
                _("Space Usage") + "(MB)", _("Space Quota") + "(MB)",
                _("Create At"), _("Last Login"), _("Admin"), _("LDAP(imported)"),]

    # only operate 100 users for every `for` loop
    looped = 0
    limit = 100
    data_list = []

    while looped < len(users):

        current_users = users[looped:looped+limit]

        last_logins = UserLastLogin.objects.filter(username__in=[x.email \
                for x in current_users])
        user_profiles = Profile.objects.filter(user__in=[x.email \
                for x in current_users])

        for user in current_users:
            # populate name and contact email
            user.contact_email = ''
            user.name = ''
            for profile in user_profiles:
                if profile.user == user.email:
                    user.contact_email = profile.contact_email
                    user.name = profile.nickname

            # populate space usage and quota
            MB = get_file_size_unit('MB')

            _populate_user_quota_usage(user)
            if user.space_usage > 0:
                try:
                    space_usage_MB = round(float(user.space_usage) / MB, 2)
                except Exception as e:
                    logger.error(e)
                    space_usage_MB = '--'
            else:
                space_usage_MB = ''

            if user.space_quota > 0:
                try:
                    space_quota_MB = round(float(user.space_quota) / MB, 2)
                except Exception as e:
                    logger.error(e)
                    space_quota_MB = '--'
            else:
                space_quota_MB = ''

            # populate user last login time
            user.last_login = None
            for last_login in last_logins:
                if last_login.username == user.email:
                    user.last_login = last_login.last_login

            if user.is_active:
                status = _('Active')
            else:
                status = _('Inactive')

            create_at = tsstr_sec(user.ctime) if user.ctime else ''
            last_login = user.last_login.strftime("%Y-%m-%d %H:%M:%S") if \
                user.last_login else ''

            is_admin = _('Yes') if user.is_staff else ''
            ldap_import = _('Yes') if user.source == 'LDAPImport' else ''

            if is_pro:
                if user.role:
                    if user.role == GUEST_USER:
                        role = _('Guest')
                    elif user.role == DEFAULT_USER:
                        role = _('Default')
                    else:
                        role = user.role
                else:
                    role = _('Default')

                row = [user.email, user.name, user.contact_email, status, role,
                        space_usage_MB, space_quota_MB, create_at,
                        last_login, is_admin, ldap_import]
            else:
                row = [user.email, user.name, user.contact_email, status,
                        space_usage_MB, space_quota_MB, create_at,
                        last_login, is_admin, ldap_import]

            data_list.append(row)

        # update `looped` value when `for` loop finished
        looped += limit

    wb = write_xls('users', head, data_list)
    if not wb:
        messages.error(request, _('Failed to export Excel'))
        return HttpResponseRedirect(next_page)

    response = HttpResponse(content_type='application/ms-excel')
    response['Content-Disposition'] = 'attachment; filename=users.xlsx'
    wb.save(response)
    return response


@login_required
@sys_staff_required
def sys_group_admin_export_excel(request):
    """ Export all groups to excel
    """

    next_page = request.META.get('HTTP_REFERER', None)
    if not next_page:
        next_page = SITE_ROOT

    try:
        groups = ccnet_threaded_rpc.get_all_groups(-1, -1)
    except Exception as e:
        logger.error(e)
        messages.error(request, _('Failed to export Excel'))
        return HttpResponseRedirect(next_page)

    head = [_("Name"), _("Creator"), _("Create At")]
    data_list = []
    for grp in groups:
        create_at = tsstr_sec(grp.timestamp) if grp.timestamp else ''
        row = [grp.group_name, grp.creator_name, create_at]
        data_list.append(row)

    wb = write_xls('groups', head, data_list)
    if not wb:
        messages.error(request, _('Failed to export Excel'))
        return HttpResponseRedirect(next_page)

    response = HttpResponse(content_type='application/ms-excel')
    response['Content-Disposition'] = 'attachment; filename=groups.xlsx'
    wb.save(response)
    return response

@login_required
@sys_staff_required
def batch_add_user_example(request):
    """ get example file.
    """
    next_page = request.META.get('HTTP_REFERER', None)
    if not next_page:
        next_page = SITE_ROOT
    data_list = []
    head = [_('Email'), _('Password'), _('Name')+ '(' + _('Optional') + ')',
            _('Role') + '(' + _('Optional') + ')', _('Space Quota') + '(MB, ' + _('Optional') + ')']
    for i in range(5):
        username = "test" + str(i) +"@example.com"
        password = "123456"
        name = "test" + str(i)
        role = "default"
        quota = "1000"
        data_list.append([username, password, name, role, quota])

    wb = write_xls('sample', head, data_list)
    if not wb:
        messages.error(request, _('Failed to export Excel'))
        return HttpResponseRedirect(next_page)

    response = HttpResponse(content_type='application/ms-excel')
    response['Content-Disposition'] = 'attachment; filename=users.xlsx'
    wb.save(response)
    return response
