# Copyright (c) 2012-2016 Seafile Ltd.
import logging
from django.db.models import Q
from types import FunctionType
from constance import config

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _

from seaserv import seafile_api, ccnet_api

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error, to_python_boolean

import seahub.settings as settings
from seahub.settings import SEND_EMAIL_ON_ADDING_SYSTEM_MEMBER
from seahub.base.models import UserLastLogin
from seahub.base.accounts import User
from seahub.base.templatetags.seahub_tags import email2nickname, \
        email2contact_email
from seahub.profile.models import Profile
from seahub.profile.settings import CONTACT_CACHE_TIMEOUT, CONTACT_CACHE_PREFIX, \
    NICKNAME_CACHE_PREFIX, NICKNAME_CACHE_TIMEOUT
from seahub.utils import is_valid_username, is_org_context, \
        is_pro_version, normalize_cache_key, is_valid_email, \
        IS_EMAIL_CONFIGURED, send_html_email, get_site_name
from seahub.settings import SEND_EMAIL_ON_ADDING_SYSTEM_MEMBER, INIT_PASSWD, \
    SEND_EMAIL_ON_RESETTING_USER_PASSWD
from seahub.utils.timeutils import timestamp_to_isoformat_timestr, datetime_to_isoformat_timestr
from seahub.utils.file_size import get_file_size_unit
from seahub.avatar.templatetags.avatar_tags import api_avatar_url
from seahub.utils.user_permissions import get_user_role
from seahub.role_permissions.utils import get_available_roles
from seahub.role_permissions.models import AdminRole
from seahub.constants import DEFAULT_ADMIN
from seahub.utils.licenseparse import user_number_over_limit
from seahub.institutions.models import InstitutionAdmin
from seahub.admin_log.signals import admin_operation
from seahub.admin_log.models import USER_DELETE, USER_ADD
from seahub.institutions.models import Institution
from seahub.options.models import UserOptions
from seahub.dtable.models import Workspaces


logger = logging.getLogger(__name__)
json_content_type = 'application/json; charset=utf-8'

def get_virtual_id_by_email(email):
    profile_obj = Profile.objects.get_profile_by_contact_email(email)
    if profile_obj is None:
        return email
    else:
        return profile_obj.user

def create_user_info(request, email, role, nickname, contact_email, quota_total_mb):
    # update additional user info

    if is_pro_version() and role:
        User.objects.update_role(email, role)

    if nickname is not None:
        Profile.objects.add_or_update(email, nickname)
        key = normalize_cache_key(nickname, NICKNAME_CACHE_PREFIX)
        cache.set(key, nickname, NICKNAME_CACHE_TIMEOUT)

    if contact_email is not None:
        Profile.objects.add_or_update(email, contact_email=contact_email)
        key = normalize_cache_key(email, CONTACT_CACHE_PREFIX)
        cache.set(key, contact_email, CONTACT_CACHE_TIMEOUT)

    if quota_total_mb:
        quota_total = int(quota_total_mb) * get_file_size_unit('MB')
        if is_org_context(request):
            org_id = request.user.org.org_id
            seafile_api.set_org_user_quota(org_id, email, quota_total)
        else:
            seafile_api.set_user_quota(email, quota_total)

def update_user_info(request, user, password, is_active, is_staff, role,
                     nickname, login_id, contact_email, quota_total_mb, institution_name):

    # update basic user info
    if is_active is not None:
        user.is_active = is_active

    if password:
        user.set_password(password)

    if is_staff is not None:
        user.is_staff = is_staff

    # update user
    user.save()

    email = user.username

    # update additional user info
    if is_pro_version() and role:
        User.objects.update_role(email, role)

    if nickname is not None:
        Profile.objects.add_or_update(email, nickname)
        key = normalize_cache_key(nickname, NICKNAME_CACHE_PREFIX)
        cache.set(key, nickname, NICKNAME_CACHE_TIMEOUT)

    if login_id is not None:
        Profile.objects.add_or_update(email, login_id=login_id)

    if contact_email is not None:
        Profile.objects.add_or_update(email, contact_email=contact_email)
        key = normalize_cache_key(email, CONTACT_CACHE_PREFIX)
        cache.set(key, contact_email, CONTACT_CACHE_TIMEOUT)

    if institution_name is not None:
        Profile.objects.add_or_update(email, institution=institution_name)
        if institution_name == '':
            InstitutionAdmin.objects.filter(user=email).delete()

    if quota_total_mb:
        quota_total = int(quota_total_mb) * get_file_size_unit('MB')
        orgs = ccnet_api.get_orgs_by_user(email)
        try:
            if orgs:
                org_id = orgs[0].org_id
                seafile_api.set_org_user_quota(org_id, email, quota_total)
            else:
                seafile_api.set_user_quota(email, quota_total)
        except Exception as e:
            logger.error(e)
            seafile_api.set_user_quota(email, -1)

def get_user_info(email):
    user = User.objects.get(email=email)
    profile = Profile.objects.get_profile_by_user(email)

    info = {}
    info['email'] = email
    info['name'] = email2nickname(email)
    info['contact_email'] = profile.contact_email if profile and profile.contact_email else ''
    info['login_id'] = profile.login_id if profile and profile.login_id else ''

    info['is_staff'] = user.is_staff
    info['is_active'] = user.is_active

    orgs = ccnet_api.get_orgs_by_user(email)
    try:
        if orgs:
            org_id = orgs[0].org_id
            info['org_id'] = org_id
            info['org_name'] = orgs[0].org_name
    except Exception as e:
        logger.error(e)

    info['create_time'] = timestamp_to_isoformat_timestr(user.ctime)

    if getattr(settings, 'MULTI_INSTITUTION', False):
        info['institution'] = profile.institution if profile else ''

    info['role'] = get_user_role(user)

    return info


class AdminUsers(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAdminUser, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        """List all users in DB or LDAPImport

        Permission checking:
        1. only admin can perform this action.
        """

        try:
            page = int(request.GET.get('page', '1'))
            per_page = int(request.GET.get('per_page', '25'))
        except ValueError:
            page = 1
            per_page = 25

        start = (page - 1) * per_page

        # source: 'DB' or 'LDAPImport', default is 'DB'
        source = request.GET.get('source', 'DB')
        source = source.lower()
        if source not in ['db', 'ldapimport']:
            error_msg = 'source %s invalid.' % source
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if source == 'db':
            users = ccnet_api.get_emailusers('DB', start, per_page)
            total_count = ccnet_api.count_emailusers('DB') + \
                          ccnet_api.count_inactive_emailusers('DB')
        elif source == 'ldapimport':
            users = ccnet_api.get_emailusers('LDAPImport', start, per_page)
            # api param is 'LDAP', but actually get count of 'LDAPImport' users
            total_count = ccnet_api.count_emailusers('LDAP') + \
                          ccnet_api.count_inactive_emailusers('LDAP')

        data = []
        for user in users:
            profile = Profile.objects.get_profile_by_user(user.email)

            info = {}
            info['email'] = user.email
            info['name'] = email2nickname(user.email)
            info['contact_email'] = email2contact_email(user.email)
            info['login_id'] = profile.login_id if profile and profile.login_id else ''

            info['is_staff'] = user.is_staff
            info['is_active'] = user.is_active

            orgs = ccnet_api.get_orgs_by_user(user.email)
            try:
                if orgs:
                    org_id = orgs[0].org_id
                    info['org_id'] = org_id
                    info['org_name'] = orgs[0].org_name
            except Exception as e:
                logger.error(e)

            info['create_time'] = timestamp_to_isoformat_timestr(user.ctime)
            last_login_obj = UserLastLogin.objects.get_by_username(user.email)
            info['last_login'] = datetime_to_isoformat_timestr(last_login_obj.last_login) if last_login_obj else ''
            info['role'] = get_user_role(user)
            info['storage_usage'] = Workspaces.objects.get_owner_total_storage(owner=user.email)
            if getattr(settings, 'MULTI_INSTITUTION', False):
                info['institution'] = profile.institution if profile else ''

            data.append(info)

        result = {'data': data, 'total_count': total_count}
        return Response(result)

    def post(self, request):

        if user_number_over_limit():
            error_msg = _("The number of users exceeds the limit.")
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        email = request.data.get('email', None)
        if not email or not is_valid_username(email):
            error_msg = 'email invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # basic user info check
        is_staff = request.data.get("is_staff", 'False')
        try:
            is_staff = to_python_boolean(is_staff)
        except ValueError:
            error_msg = 'is_staff invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        is_active = request.data.get("is_active", 'True')
        try:
            is_active = to_python_boolean(is_active)
        except ValueError:
            error_msg = 'is_active invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # additional user info check
        role = request.data.get("role", None)
        if role:
            available_roles = get_available_roles()
            if role.lower() not in available_roles:
                error_msg = 'role must be in %s.' % str(available_roles)
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        name = request.data.get("name", None)
        if name:
            if len(name) > 64:
                error_msg = 'Name is too long (maximum is 64 characters).'
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            if "/" in name:
                error_msg = "Name should not include '/'."
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        else:
            name = email.split('@')[0]

        quota_total_mb = request.data.get("quota_total", None)
        if quota_total_mb:
            try:
                quota_total_mb = int(quota_total_mb)
            except ValueError:
                error_msg = "Must be an integer that is greater than or equal to 0."
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            if quota_total_mb < 0:
                error_msg = "Space quota is too low (minimum value is 0)."
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            if is_org_context(request):
                org_id = request.user.org.org_id
                org_quota_mb = seafile_api.get_org_quota(org_id) / \
                        get_file_size_unit('MB')

                if quota_total_mb > org_quota_mb:
                    error_msg = 'Failed to set quota: maximum quota is %d MB' % org_quota_mb
                    return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        vid = get_virtual_id_by_email(email)
        try:
            User.objects.get(email=vid)
            user_exist = True
        except User.DoesNotExist:
            user_exist = False

        if user_exist:
            error_msg = "User %s already exists." % email
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        password = request.data.get('password', None)
        if not password:
            error_msg = 'password required.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # create user
        try:
            user_obj = User.objects.create_user(email, password, is_staff, is_active)
            create_user_info(request, email=user_obj.username, role=role,
                             nickname=name, contact_email=None,
                             quota_total_mb=quota_total_mb)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        add_user_tip = _('Successfully added user %(user)s.') % {'user': email}
        if IS_EMAIL_CONFIGURED and SEND_EMAIL_ON_ADDING_SYSTEM_MEMBER:
            c = {'user': request.user.username, 'email': email, 'password': password}
            try:
                send_html_email(_('You are invited to join %s') % get_site_name(),
                        'sysadmin/user_add_email.html', c, None, [email])
                add_user_tip = _('Successfully added user %(user)s. An email notification has been sent.') % {'user': email}
            except Exception as e:
                logger.error(str(e))
                add_user_tip = _('Successfully added user %(user)s. But email notification can not be sent, because Email service is not properly configured.') % {'user': email}

        virtual_id = get_virtual_id_by_email(email)
        user_info = get_user_info(virtual_id)
        user_info['add_user_tip'] = add_user_tip

        # send admin operation log signal
        admin_op_detail = {
            "email": email,
        }
        admin_operation.send(sender=None, admin_name=request.user.username,
                             operation=USER_ADD, detail=admin_op_detail)

        return Response(user_info)


class AdminUser(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAdminUser, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request, email):

        avatar_size = request.data.get('avatar_size', 64)
        try:
            avatar_size = int(avatar_size)
        except Exception as e:
            logger.error(e)
            error_msg = 'avatar_size invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            error_msg = 'User %s not found.' % email
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        user_info = get_user_info(email)

        # get other detailed info
        user_info['avatar_url'], _, _ = api_avatar_url(email, avatar_size)
        try:
            user_info['storage_usage'] = Workspaces.objects.get_owner_total_storage(owner=email)
        except Exception as e:
            logging.error(e)
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Internal Server Error')

        return Response(user_info)

    def put(self, request, email):

        # basic user info check
        is_staff = request.data.get("is_staff", None)
        if is_staff:
            try:
                is_staff = to_python_boolean(is_staff)
            except ValueError:
                error_msg = 'is_staff invalid.'
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        is_active = request.data.get("is_active", None)
        if is_active:
            try:
                is_active = to_python_boolean(is_active)
            except ValueError:
                error_msg = 'is_active invalid.'
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # additional user info check
        role = request.data.get("role", None)
        if role:
            available_roles = get_available_roles()
            if role.lower() not in available_roles:
                error_msg = 'role must be in %s.' % str(available_roles)
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        name = request.data.get("name", None)
        if name:
            if len(name) > 64:
                error_msg = 'Name is too long (maximum is 64 characters).'
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            if "/" in name:
                error_msg = "Name should not include '/'."
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # argument check for login_id
        login_id = request.data.get("login_id", None)
        if login_id is not None:
            login_id = login_id.strip()
            username_by_login_id = Profile.objects.get_username_by_login_id(login_id)
            if username_by_login_id is not None:
                return api_error(status.HTTP_400_BAD_REQUEST, 
                                 _("Login id %s already exists." % login_id))

        contact_email = request.data.get("contact_email", None)
        if contact_email is not None and contact_email.strip() != '':
            if not is_valid_email(contact_email):
                error_msg = 'Contact email invalid.'
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        password = request.data.get("password")

        quota_total_mb = request.data.get("quota_total", None)
        if quota_total_mb:
            try:
                quota_total_mb = int(quota_total_mb)
            except ValueError:
                error_msg = "Must be an integer that is greater than or equal to 0."
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            if quota_total_mb < 0:
                error_msg = "Space quota is too low (minimum value is 0)."
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

            if is_org_context(request):
                org_id = request.user.org.org_id
                org_quota_mb = seafile_api.get_org_quota(org_id) / \
                        get_file_size_unit('MB')

                if quota_total_mb > org_quota_mb:
                    error_msg = 'Failed to set quota: maximum quota is %d MB' % org_quota_mb
                    return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        institution = request.data.get("institution", None)
        if institution:
            try:
                Institution.objects.get(name=institution)
            except Institution.DoesNotExist:
                error_msg = 'Institution %s does not exist' % institution
                return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        # query user info
        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            error_msg = 'User %s not found.' % email
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        try:
            update_user_info(request, user=user_obj, password=password, is_active=is_active, is_staff=is_staff,
                             role=role, nickname=name, login_id=login_id, contact_email=contact_email,
                             quota_total_mb=quota_total_mb, institution_name=institution)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # update user
        try:
            user_obj.save()
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal server error.'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        update_status_tip = ''
        if is_active is not None:
            update_status_tip = _('Edit succeeded')
            if user_obj.is_active and IS_EMAIL_CONFIGURED:
                send_to = user_obj.email
                profile = Profile.objects.get_profile_by_user(user_obj.email)
                if profile and profile.contact_email:
                    send_to = profile.contact_email 
                try:
                    send_html_email(_(u'Your account on %s is activated') % get_site_name(),
                                    'sysadmin/user_activation_email.html', {'username': user_obj.email}, None, [send_to])
                    update_status_tip = _('Edit succeeded, an email has been sent.')
                except Exception as e:
                    logger.error(e)
                    update_status_tip = _('Edit succeeded, but failed to send email, please check your email configuration.')

        user_info = get_user_info(email)
        user_info['update_status_tip'] = update_status_tip

        return Response(user_info)

    def delete(self, request, email):

        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            error_msg = 'User %s not found.' % email
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # delete user
        try:
            User.objects.get(email=email).delete()
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # send admin operation log signal
        admin_op_detail = {
            "email": email,
        }
        admin_operation.send(sender=None, admin_name=request.user.username,
                             operation=USER_DELETE, detail=admin_op_detail)

        return Response({'success': True})


class AdminSearchUser(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAdminUser, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        """Search user from DB, LDAPImport and Profile

        Permission checking:
        1. only admin can perform this action.
        """

        query_str = request.GET.get('query', '').lower()
        if not query_str:
            error_msg = 'query invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        users = []

        # search user from ccnet db
        users += ccnet_api.search_emailusers('DB', query_str, 0, 10)

        # search user from ccnet ldapimport
        users += ccnet_api.search_emailusers('LDAP', query_str, 0, 10)

        ccnet_user_emails = [u.email for u in users]

        # get institution for user from ccnet
        if getattr(settings, 'MULTI_INSTITUTION', False):
            user_institution_dict = {}
            profiles = Profile.objects.filter(user__in=ccnet_user_emails)
            for profile in profiles:
                email = profile.user
                if email not in user_institution_dict:
                    user_institution_dict[email] = profile.institution

            for user in users:
                user.institution = user_institution_dict.get(user.email, '')

        # search user from profile
        searched_profile = Profile.objects.filter((Q(nickname__icontains=query_str)) |
                                                  Q(contact_email__icontains=query_str))[:10]

        for profile in searched_profile:
            email = profile.user
            institution = profile.institution

            # remove duplicate emails
            if email not in ccnet_user_emails:
                try:
                    # get is_staff and is_active info
                    user = User.objects.get(email=email)
                    user.institution = institution
                    users.append(user)
                except User.DoesNotExist:
                    continue

        data = []
        for user in users:

            info = {}
            info['email'] = user.email
            info['name'] = email2nickname(user.email)
            info['contact_email'] = email2contact_email(user.email)

            info['is_staff'] = user.is_staff
            info['is_active'] = user.is_active

            info['source'] = user.source.lower()

            orgs = ccnet_api.get_orgs_by_user(user.email)
            if orgs:
                org_id = orgs[0].org_id
                info['org_id'] = org_id
                info['org_name'] = orgs[0].org_name
                info['quota_usage'] = seafile_api.get_org_user_quota_usage(org_id, user.email)
                info['quota_total'] = seafile_api.get_org_user_quota(org_id, user.email)
            else:
                info['quota_usage'] = seafile_api.get_user_self_usage(user.email)
                info['quota_total'] = seafile_api.get_user_quota(user.email)

            info['create_time'] = timestamp_to_isoformat_timestr(user.ctime)
            last_login_obj = UserLastLogin.objects.get_by_username(user.email)
            info['last_login'] = datetime_to_isoformat_timestr(last_login_obj.last_login) if last_login_obj else ''
            info['role'] = get_user_role(user)

            if getattr(settings, 'MULTI_INSTITUTION', False):
                info['institution'] = user.institution

            data.append(info)

        result = {'user_list': data}
        return Response(result)


class AdminUserResetPassword(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAdminUser, )
    throttle_classes = (UserRateThrottle, )

    def put(self, request, email):
        """Reset password for user

        Permission checking:
        1. only admin can perform this action.
        """

        if not is_valid_username(email):
            error_msg = 'email invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist as e:
            logger.error(e)
            error_msg = 'email invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        if isinstance(INIT_PASSWD, FunctionType):
            new_password = INIT_PASSWD()
        else:
            new_password = INIT_PASSWD
        user.set_password(new_password)
        user.save()

        if config.FORCE_PASSWORD_CHANGE:
            UserOptions.objects.set_force_passwd_change(user.username)

        contact_email = Profile.objects.get_contact_email_by_user(email)
        if IS_EMAIL_CONFIGURED:
            if SEND_EMAIL_ON_RESETTING_USER_PASSWD:
                c = {'email': contact_email, 'password': new_password}
                try:
                    send_html_email(_(u'Password has been reset on %s') % get_site_name(),
                                'sysadmin/user_reset_email.html', c, None, [contact_email])
                    reset_tip = _('Successfully reset password to %(passwd)s, an email has been sent to %(user)s.') % \
                        {'passwd': new_password, 'user': contact_email}
                except Exception as e:
                    logger.warning(e)
                    reset_tip = _('Successfully reset password to %(passwd)s, but failed to send email to %(user)s, please check your email configuration.') % \
                        {'passwd': new_password, 'user': contact_email}
            else:
                reset_tip = _('Successfully reset password to %(passwd)s for user %(user)s.') % \
                    {'passwd': new_password, 'user': contact_email}
        else:
            reset_tip = _('Successfully reset password to %(passwd)s for user %(user)s. But email notification can not be sent, because Email service is not properly configured.') % \
                {'passwd': new_password, 'user': contact_email}

        return Response({'new_password': new_password, 'reset_tip': reset_tip})


class AdminUserGroups(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAdminUser, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request, email):
        """ return all groups user joined

        Permission checking:
        1. Admin user;
        """

        if not is_valid_username(email):
            error_msg = 'email invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        try:
            User.objects.get(email=email)
        except User.DoesNotExist as e:
            logger.error(e)
            error_msg = 'User %s not found.' % email
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        groups_info = []
        try:
            groups = ccnet_api.get_personal_groups_by_user(email)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        # Use dict to reduce memcache fetch cost in large for-loop.
        nickname_dict = {}
        creator_name_set = set([g.creator_name for g in groups])
        for e in creator_name_set:
            if e not in nickname_dict:
                nickname_dict[e] = email2nickname(e)

        for group in groups:
            isoformat_timestr = timestamp_to_isoformat_timestr(group.timestamp)
            group_info = {
                "id": group.id,
                "name": group.group_name,
                "owner_email": group.creator_name,
                "owner_name": nickname_dict.get(group.creator_name, ''),
                "created_at": isoformat_timestr,
                "parent_group_id": group.parent_group_id if is_pro_version() else 0
            }
            groups_info.append(group_info)

            try:
                is_group_staff = ccnet_api.check_group_staff(group.id, email)
            except Exception as e:
                logger.error(e)
                error_msg = 'Internal Server Error'
                return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

            if email == group.creator_name:
                group_info['role'] = 'Owner'
            elif is_group_staff:
                group_info['role'] = 'Admin'
            else:
                group_info['role'] = 'Member'
        return Response({'group_list': groups_info})


class AdminAdminUsers(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAdminUser, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        """List all admins from database and ldap imported
        """
        try:
            admin_users = ccnet_api.get_superusers()
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        admin_users_info = []
        for user in admin_users:
            user_info = {}
            profile = Profile.objects.get_profile_by_user(user.email)
            user_info['email'] = user.email
            user_info['name'] = email2nickname(user.email)
            user_info['contact_email'] = email2contact_email(user.email)
            user_info['login_id'] = profile.login_id if profile and profile.login_id else ''

            user_info['is_staff'] = user.is_staff
            user_info['is_active'] = user.is_active

            orgs = ccnet_api.get_orgs_by_user(user.email)
            try:
                if orgs:
                    org_id = orgs[0].org_id
                    user_info['org_id'] = org_id
                    user_info['org_name'] = orgs[0].org_name
            except Exception as e:
                logger.error(e)

            user_info['create_time'] = timestamp_to_isoformat_timestr(user.ctime)
            last_login_obj = UserLastLogin.objects.get_by_username(user.email)
            user_info['last_login'] = datetime_to_isoformat_timestr(last_login_obj.last_login) if last_login_obj else ''

            try:
                admin_role = AdminRole.objects.get_admin_role(user.email)
                user_info['admin_role'] = admin_role.role
            except AdminRole.DoesNotExist:
                user_info['admin_role'] = DEFAULT_ADMIN
            admin_users_info.append(user_info)

        result = {
            'admin_user_list': admin_users_info,
        }
        return Response(result)
