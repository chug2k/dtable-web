# Copyright (c) 2012-2016 Seafile Ltd.
# encoding: utf-8
import logging

from django.core.mail import send_mail
from django.utils import translation
from django.utils.encoding import smart_text
from django.utils.translation import ugettext_lazy as _
from django.conf import settings
import seaserv
from seaserv import ccnet_threaded_rpc, unset_repo_passwd, \
    seafile_api, ccnet_api
from constance import config
from seahub.registration import signals
from seahub.constants import DEFAULT_USER, DEFAULT_ADMIN, ORG_DEFAULT
from seahub.profile.models import Profile
from seahub.role_permissions.models import AdminRole
from seahub.role_permissions.utils import get_enabled_role_permissions_by_role, \
        get_enabled_admin_role_permissions_by_role
from seahub.utils import get_site_name, \
    clear_token, get_system_admins, is_pro_version, IS_EMAIL_CONFIGURED
from seahub.utils.mail import send_html_email_with_dj_template, MAIL_PRIORITY
from seahub.utils.auth import gen_user_virtual_id, is_user_virtual_id

try:
    from seahub.settings import CLOUD_MODE
except ImportError:
    CLOUD_MODE = False
try:
    from seahub.settings import MULTI_TENANCY
except ImportError:
    MULTI_TENANCY = False
try:
    import ldap
    import ldap.filter
    from seahub.settings import ENABLE_LDAP, LDAP_SERVER_URL, LDAP_BASE_DN, LDAP_ADMIN_EMAIL, LDAP_ADMIN_PASSWORD, LDAP_LOGIN_ATTR
except ImportError:
    ENABLE_LDAP = False
    LDAP_SERVER_URL = ''
    LDAP_BASE_DN = ''
    LDAP_ADMIN_EMAIL = ''
    LDAP_ADMIN_PASSWORD = ''
    LDAP_LOGIN_ATTR = ''

logger = logging.getLogger(__name__)

ANONYMOUS_EMAIL = 'Anonymous'

UNUSABLE_PASSWORD = '!' # This will never be a valid hash

class UserManager(object):

    def create_user(self, email, password=None, is_staff=False, is_active=False):
        """
        Creates and saves a User with given username and password.
        """
        virtual_id = gen_user_virtual_id()

        # Lowercasing email address to avoid confusion.
        email = email.lower()

        user = User(email=virtual_id)
        user.is_staff = is_staff
        user.is_active = is_active
        user.set_password(password)
        user.save()

        # Set email as contact email.
        Profile.objects.add_or_update(username=virtual_id, contact_email=email)

        return self.get(email=virtual_id)

    def create_oauth_user(self, email=None, password=None, is_staff=False, is_active=False):
        """
        Creates and saves an oauth User which can without email.
        """
        virtual_id = gen_user_virtual_id()

        user = User(email=virtual_id)
        user.is_staff = is_staff
        user.is_active = is_active
        user.set_password(password)
        user.save()

        # Set email as contact email.
        if email:
            email = email.lower()
        Profile.objects.add_or_update(username=virtual_id, contact_email=email)

        return self.get(email=virtual_id)

    def create_ldap_user(self, email=None, password=None, nickname=None, is_staff=False, is_active=False):
        """
        Creates and saves an ldap User which can without email.
        """
        virtual_id = gen_user_virtual_id()

        user = User(email=virtual_id)
        user.is_staff = is_staff
        user.is_active = is_active
        user.set_password(password)
        user.save()

        # Set email as contact email.
        if email:
            email = email.lower()
        Profile.objects.add_or_update(username=virtual_id, contact_email=email, nickname=nickname)

        return self.get(email=virtual_id)

    def create_saml_user(self, email=None, password=None, nickname=None, is_staff=False, is_active=False):
        """
        Creates and saves an saml User which can without email.
        """
        virtual_id = gen_user_virtual_id()

        user = User(email=virtual_id)
        user.is_staff = is_staff
        user.is_active = is_active
        user.set_password(password)
        user.save()

        # Set email as contact email.
        if email:
            email = email.lower()
        Profile.objects.add_or_update(username=virtual_id, contact_email=email, nickname=nickname)

        return self.get(email=virtual_id)

    def update_role(self, email, role):
        """
        If user has a role, update it; or create a role for user.
        """
        ccnet_api.update_role_emailuser(email, role)
        return self.get(email=email)

    def create_superuser(self, email, password):
        u = self.create_user(email, password, is_staff=True, is_active=True)
        Profile.objects.add_or_update(username=u.username, nickname='admin')
        return u

    def get_superusers(self):
        """Return a list of admins.
        """
        emailusers = ccnet_threaded_rpc.get_superusers()

        user_list = []
        for e in emailusers:
            user = User(e.email)
            user.id = e.id
            user.is_staff = e.is_staff
            user.is_active = e.is_active
            user.ctime = e.ctime
            user_list.append(user)

        return user_list

    def get(self, email=None, id=None):
        if not email and not id:
            raise User.DoesNotExist('User matching query does not exits.')

        if email:
            emailuser = ccnet_threaded_rpc.get_emailuser(email)
        if id:
            emailuser = ccnet_threaded_rpc.get_emailuser_by_id(id)
        if not emailuser:
            raise User.DoesNotExist('User matching query does not exits.')

        user = User(emailuser.email)
        user.id = emailuser.id
        user.enc_password = emailuser.password
        user.is_staff = emailuser.is_staff
        user.is_active = emailuser.is_active
        user.ctime = emailuser.ctime
        user.org = emailuser.org
        user.source = emailuser.source
        user.role = emailuser.role
        user.reference_id = emailuser.reference_id

        if user.is_staff:
            try:
                role_obj = AdminRole.objects.get_admin_role(emailuser.email)
                admin_role = role_obj.role
            except AdminRole.DoesNotExist:
                admin_role = DEFAULT_ADMIN

            user.admin_role = admin_role
        else:
            user.admin_role = ''

        return user

class UserPermissions(object):
    def __init__(self, user):
        self.user = user

    def _get_perm_by_roles(self, perm_name):
        role = self.user.role
        return get_enabled_role_permissions_by_role(role).get(perm_name, False)

    def can_add_group(self):
        return self._get_perm_by_roles('can_add_group')

    def can_add_dtable(self):
        return self._get_perm_by_roles('can_add_dtable')

    def can_generate_share_link(self):
        return self._get_perm_by_roles('can_generate_share_link')

    def can_use_global_address_book(self):
        return self._get_perm_by_roles('can_use_global_address_book')

    def can_add_public_repo(self):
        """ Check if user can create public repo or share existed repo to public.

        Used when MULTI_TENANCY feature is NOT enabled.
        """

        if CLOUD_MODE:
            if MULTI_TENANCY:
                return True
            else:
                return False
        elif self.user.is_staff:
            return True
        elif self._get_perm_by_roles('can_add_public_repo') and \
                bool(config.ENABLE_USER_CREATE_ORG_REPO):
            return True
        else:
            return False

    def can_drag_drop_folder_to_sync(self):
        return self._get_perm_by_roles('can_drag_drop_folder_to_sync')

    def can_connect_with_android_clients(self):
        return self._get_perm_by_roles('can_connect_with_android_clients')

    def can_connect_with_ios_clients(self):
        return self._get_perm_by_roles('can_connect_with_ios_clients')

    def can_connect_with_desktop_clients(self):
        return self._get_perm_by_roles('can_connect_with_desktop_clients')

    def can_invite_guest(self):
        return self._get_perm_by_roles('can_invite_guest')

    def can_create_common_dataset(self):
        return self._get_perm_by_roles('can_create_common_dataset')

    def can_export_files_via_mobile_client(self):
        return self._get_perm_by_roles('can_export_files_via_mobile_client')

    def role_quota(self):
        return self._get_perm_by_roles('role_quota')

    def role_asset_quota(self):
        return self._get_perm_by_roles('role_asset_quota')

    def can_send_share_link_mail(self):
        if not IS_EMAIL_CONFIGURED:
            return False

        return self._get_perm_by_roles('can_send_share_link_mail')

    def can_generate_external_link(self):
        return self._get_perm_by_roles('can_generate_external_link')

    def storage_ids(self):
        return self._get_perm_by_roles('storage_ids')


class AdminPermissions(object):
    def __init__(self, user):
        self.user = user

    def can_view_system_info(self):
        return get_enabled_admin_role_permissions_by_role(self.user.admin_role)['can_view_system_info']

    def can_view_statistic(self):
        return get_enabled_admin_role_permissions_by_role(self.user.admin_role)['can_view_statistic']

    def can_config_system(self):
        return get_enabled_admin_role_permissions_by_role(self.user.admin_role)['can_config_system']

    def can_manage_library(self):
        return get_enabled_admin_role_permissions_by_role(self.user.admin_role)['can_manage_library']

    def can_manage_user(self):
        return get_enabled_admin_role_permissions_by_role(self.user.admin_role)['can_manage_user']

    def can_manage_group(self):
        return get_enabled_admin_role_permissions_by_role(self.user.admin_role)['can_manage_group']

    def can_manage_external_link(self):
        return get_enabled_admin_role_permissions_by_role(self.user.admin_role)['can_manage_external_link']

    def can_view_user_log(self):
        return get_enabled_admin_role_permissions_by_role(self.user.admin_role)['can_view_user_log']

    def can_view_admin_log(self):
        return get_enabled_admin_role_permissions_by_role(self.user.admin_role)['can_view_admin_log']

class User(object):
    is_staff = False
    is_active = False
    is_superuser = False
    groups = []
    org = None
    objects = UserManager()

    @property
    def contact_email(self):
        if not hasattr(self, '_cached_contact_email'):
            self._cached_contact_email = email2contact_email(self.username)

        return self._cached_contact_email

    @property
    def name(self):
        if not hasattr(self, '_cached_nickname'):
            # convert raw string to unicode obj
            self._cached_nickname = smart_text(email2nickname(self.username))

        return self._cached_nickname

    class DoesNotExist(Exception):
        pass

    def __init__(self, email):
        self.username = email
        self.email = email
        self.permissions = UserPermissions(self)
        self.admin_permissions = AdminPermissions(self)

    def __unicode__(self):
        return self.username

    def is_anonymous(self):
        """
        Always returns False. This is a way of comparing User objects to
        anonymous users.
        """
        return False

    def is_authenticated(self):
        """
        Always return True. This is a way to tell if the user has been
        authenticated in templates.
        """
        return True

    def save(self):
        emailuser = ccnet_threaded_rpc.get_emailuser(self.username)
        if emailuser:
            if not hasattr(self, 'password'):
                self.set_unusable_password()

            if emailuser.source == "DB":
                source = "DB"
            else:
                source = "LDAP"

            if not self.is_active:
                # clear web api and repo sync token
                # when inactive an user
                try:
                    clear_token(self.username)
                except Exception as e:
                    logger.error(e)

            result_code = ccnet_threaded_rpc.update_emailuser(source,
                                                              emailuser.id,
                                                              self.password,
                                                              int(self.is_staff),
                                                              int(self.is_active))
        else:
            result_code = ccnet_threaded_rpc.add_emailuser(self.username,
                                                           self.password,
                                                           int(self.is_staff),
                                                           int(self.is_active))
        # -1 stands for failed; 0 stands for success
        return result_code

    def delete(self):
        """
        When delete user, we should also delete group relationships.
        """
        if self.source == "DB":
            source = "DB"
        else:
            source = "LDAP"

        username = self.username

        orgs = []
        if is_pro_version():
            orgs = ccnet_api.get_orgs_by_user(username)

        # remove owned repos
        owned_repos = []
        if orgs:
            for org in orgs:
                owned_repos += seafile_api.get_org_owned_repo_list(org.org_id,
                                                                   username)
        else:
            owned_repos += seafile_api.get_owned_repo_list(username)

        for r in owned_repos:
            seafile_api.remove_repo(r.id)

        # remove shared in repos
        shared_in_repos = []
        if orgs:
            for org in orgs:
                org_id = org.org_id
                shared_in_repos = seafile_api.get_org_share_in_repo_list(org_id,
                        username, -1, -1)

                for r in shared_in_repos:
                    seafile_api.org_remove_share(org_id,
                            r.repo_id, r.user, username)
        else:
            shared_in_repos = seafile_api.get_share_in_repo_list(username, -1, -1)
            for r in shared_in_repos:
                seafile_api.remove_share(r.repo_id, r.user, username)

        # clear web api and repo sync token
        # when delete user
        try:
            clear_token(self.username)
        except Exception as e:
            logger.error(e)

        # remove current user from joined groups
        ccnet_api.remove_group_user(username)

        ccnet_api.remove_emailuser(source, username)
        signals.user_deleted.send(sender=self.__class__, username=username)

        Profile.objects.delete_profile_by_user(username)
        if config.ENABLE_TERMS_AND_CONDITIONS:
            from termsandconditions.models import UserTermsAndConditions
            UserTermsAndConditions.objects.filter(username=username).delete()
        self.delete_user_options(username)

    def get_username(self):
        return self.username

    def delete_user_options(self, username):
        """Remove user's all options.
        """
        from seahub.options.models import UserOptions
        UserOptions.objects.filter(email=username).delete()

    def get_and_delete_messages(self):
        messages = []
        return messages

    def set_password(self, raw_password):
        if raw_password is None:
            self.set_unusable_password()
        else:
            self.password = '%s' % raw_password

        # clear web api and repo sync token
        # when user password change
        try:
            clear_token(self.username)
        except Exception as e:
            logger.error(e)

    def check_password(self, raw_password):
        """
        Returns a boolean of whether the raw_password was correct. Handles
        encryption formats behind the scenes.
        """
        # Backwards-compatibility check. Older passwords won't include the
        # algorithm or salt.

        # if '$' not in self.password:
        #     is_correct = (self.password == \
        #                       get_hexdigest('sha1', '', raw_password))
        #     return is_correct
        return (ccnet_threaded_rpc.validate_emailuser(self.username, raw_password) == 0)

    def set_unusable_password(self):
        # Sets a value that will never be a valid hash
        self.password = UNUSABLE_PASSWORD

    def email_user(self, subject, message, from_email=None):
        "Sends an e-mail to this User."
        send_mail(subject, message, from_email, [self.email])

    def freeze_user(self, notify_admins=False):
        self.is_active = False
        self.save()

        if notify_admins:
            admins = get_system_admins()
            for u in admins:
                # save current language
                cur_language = translation.get_language()

                # get and active user language
                user_language = Profile.objects.get_user_language(u.email)
                translation.activate(user_language)

                send_to = u.email
                profile = Profile.objects.get_profile_by_user(u.email)
                if profile and profile.contact_email:
                    send_to = profile.contact_email 

                send_html_email_with_dj_template(
                    send_to, dj_template='sysadmin/user_freeze_email.html',
                    subject=_('Account %(account)s froze on %(site)s.') % {
                        "account": self.email,
                        "site": get_site_name(),
                    },
                    context={'user': self.email},
                    priority=MAIL_PRIORITY.now
                )

                # restore current language
                translation.activate(cur_language)

    def remove_repo_passwds(self):
        """
        Remove all repo decryption passwords stored on server.
        """
        from seahub.utils import get_user_repos
        owned_repos, shared_repos, groups_repos, public_repos = get_user_repos(self.email)

        def has_repo(repos, repo):
            for r in repos:
                if repo.id == r.id:
                    return True
            return False

        passwd_setted_repos = []
        for r in owned_repos + shared_repos + groups_repos + public_repos:
            if not has_repo(passwd_setted_repos, r) and r.encrypted and \
                    seafile_api.is_password_set(r.id, self.email):
                passwd_setted_repos.append(r)

        for r in passwd_setted_repos:
            unset_repo_passwd(r.id, self.email)

    def remove_org_repo_passwds(self, org_id):
        """
        Remove all org repo decryption passwords stored on server.
        """
        from seahub.utils import get_user_repos
        owned_repos, shared_repos, groups_repos, public_repos = get_user_repos(self.email, org_id=org_id)

        def has_repo(repos, repo):
            for r in repos:
                if repo.id == r.id:
                    return True
            return False

        passwd_setted_repos = []
        for r in owned_repos + shared_repos + groups_repos + public_repos:
            if not has_repo(passwd_setted_repos, r) and r.encrypted and \
                    seafile_api.is_password_set(r.id, self.email):
                passwd_setted_repos.append(r)

        for r in passwd_setted_repos:
            unset_repo_passwd(r.id, self.email)

class AuthBackend(object):

    def get_user_with_import(self, username):
        emailuser = seaserv.get_emailuser_with_import(username)
        if not emailuser:
            raise User.DoesNotExist('User matching query does not exits.')

        user = User(emailuser.email)
        user.id = emailuser.id
        user.enc_password = emailuser.password
        user.is_staff = emailuser.is_staff
        user.is_active = emailuser.is_active
        user.ctime = emailuser.ctime
        user.org = emailuser.org
        user.source = emailuser.source
        user.role = emailuser.role

        if user.is_staff:
            try:
                role_obj = AdminRole.objects.get_admin_role(emailuser.email)
                admin_role = role_obj.role
            except AdminRole.DoesNotExist:
                admin_role = DEFAULT_ADMIN

            user.admin_role = admin_role
        else:
            user.admin_role = ''

        return user

    def get_user(self, username):
        try:
            user = self.get_user_with_import(username)
        except User.DoesNotExist:
            user = None
        return user

    def authenticate(self, username=None, password=None):
        user = self.get_user(username)
        if not user:
            return None

        if user.check_password(password):
            return user


def get_virtual_id_by_username(username):
    # when in login username is acutally email, when auth in other, username is vid
    profile_obj = Profile.objects.get_profile_by_contact_email(username)
    if profile_obj is None:
        return username
    else:
        return profile_obj.user


def parse_userPrincipalName_and_displayName(ldap_search_result):
    user_principal_name = ''
    display_name = ''
    user_principal_name_list = ldap_search_result[0][1].get('userPrincipalName', [])
    display_name_list = ldap_search_result[0][1].get('displayName', [])

    if user_principal_name_list:
        user_principal_name = user_principal_name_list[0].decode()
    if display_name_list:
        display_name = display_name_list[0].decode()

    return user_principal_name, display_name


class CustomLDAPBackend(object):
    """ A custom LDAP authentication backend """

    def get_user(self, username):
        vid = get_virtual_id_by_username(username)
        if not vid:
            return

        try:
            user = User.objects.get(email=vid)
        except User.DoesNotExist:
            user = None
        return user

    def authenticate(self, username, password):
        if not is_pro_version() or not ENABLE_LDAP:
            return

        self.l = ldap.initialize(LDAP_SERVER_URL)

        try:
            self.l.protocol_version = ldap.VERSION3
            self.l.simple_bind_s(LDAP_ADMIN_EMAIL, LDAP_ADMIN_PASSWORD)
        except ldap.INVALID_CREDENTIALS:
            logger.error('LDAP SETTINGS ERROR.')

        if LDAP_LOGIN_ATTR.lower() in ['email', 'mail']:
            filterstr = ldap.filter.filter_format('(&(objectClass=user)(mail=%s))', [username])
        else:
            logger.error('LDAP SETTINGS ERROR.')
            return

        try:
            ldap_result_id = self.l.search(LDAP_BASE_DN, ldap.SCOPE_SUBTREE, filterstr)
            result_type, result_data = self.l.result(ldap_result_id, 1)
        except Exception as e:
            return

        # user not found in ldap
        if not result_data:
            return

        # delete old ldap connection instance and create new, if not, some err will occur
        self.l.unbind_s()
        del self.l
        self.l = ldap.initialize(LDAP_SERVER_URL)

        try:
            user_pricinpal_name, display_name = parse_userPrincipalName_and_displayName(result_data)
        except Exception:
            return

        try:
            self.l.protocol_version = ldap.VERSION3
            self.l.simple_bind_s(user_pricinpal_name, password)
        except ldap.INVALID_CREDENTIALS as e:
            return
        self.l.unbind_s()

        # check if existed
        user = self.get_user(username)
        if user:
            return user

        # user not in dtable, create user
        user = User.objects.create_ldap_user(email=username, nickname=display_name, is_active=True)
        return user


# Move here to avoid circular import
from seahub.base.templatetags.seahub_tags import email2nickname, \
    email2contact_email
