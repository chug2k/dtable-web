# Copyright (c) 2012-2016 Seafile Ltd.
import re

from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponseForbidden

from seaserv import ccnet_api

from seahub.auth.models import AnonymousUser
from seahub.notifications.models import Notification
from seahub.notifications.utils import refresh_cache
from seahub.constants import DEFAULT_ADMIN, DEFAULT_USER, ORG_DEFAULT

try:
    from seahub.settings import CLOUD_MODE
except ImportError:
    CLOUD_MODE = False
try:
    from seahub.settings import MULTI_TENANCY
except ImportError:
    MULTI_TENANCY = False
from seahub.settings import SITE_ROOT

class BaseMiddleware(object):
    """
    Middleware that add organization, group info to user.
    """

    def process_request(self, request):
        username = request.user.username
        request.user.org = None

        request.cloud_mode = CLOUD_MODE
        if not isinstance(request.user, AnonymousUser) and MULTI_TENANCY:
            orgs = ccnet_api.get_orgs_by_user(username)
            if orgs:
                request.user.org = orgs[0]
                if not request.user.role or request.user.role == DEFAULT_USER:
                    from seahub.organizations.models import OrgSettings
                    request.user.role = OrgSettings.objects.get_role_by_org(request.user.org)
        return None

    def process_response(self, request, response):
        return response

class InfobarMiddleware(object):
    """Query info bar close status, and store into request."""

    def get_from_db(self):
        ret = Notification.objects.all().filter(primary=1)
        refresh_cache()
        return ret

    def process_request(self, request):

        # filter AJAX request out
        if request.is_ajax():
            return None

        # filter API request out
        if "api2/" in request.path or "api/v2.1/" in request.path:
            return None

        topinfo_close = request.COOKIES.get('info_id', '')

        cur_note = cache.get('CUR_TOPINFO') if cache.get('CUR_TOPINFO') else \
            self.get_from_db()
        if not cur_note:
            request.cur_note = None
        else:
            if str(cur_note[0].id) in topinfo_close.split('_'):
                request.cur_note = None
            else:
                request.cur_note = cur_note[0]

        return None

    def process_response(self, request, response):
        return response


class ForcePasswdChangeMiddleware(object):
    def _request_in_black_list(self, request):
        path = request.path
        black_list = (r'^%s$' % SITE_ROOT, r'home/.+', r'repo/.+',
                      r'[f|d]/[a-f][0-9]+', r'group/\d+', r'groups/',
                      r'share/', r'profile/', r'notification/list/')

        for patt in black_list:
            if re.search(patt, path) is not None:
                return True
        return False

    def process_request(self, request):
        if request.session.get('force_passwd_change', False):
            if self._request_in_black_list(request):
                return HttpResponseRedirect(reverse('auth_password_change'))


class UserPermissionMiddleware(object):

    def process_request(self, request):

        user = request.user
        if not user.is_authenticated() or \
                not user.is_staff or \
                not hasattr(user, 'admin_role'):
            return None

        role = user.admin_role
        if not role or role == DEFAULT_ADMIN:
            return None

        permission_url = {
            'can_view_system_info': [
                'api/v2.1/admin/sysinfo',
            ],
            'can_view_statistic': [
                'sys/statistic/file',
                'sys/statistic/storage',
                'sys/statistic/user',
                'sys/trafficadmin',
                'api/v2.1/admin/statistics',
            ],
            'can_config_system': [
                'sys/settings',
                'api/v2.1/admin/logo',
                'api/v2.1/admin/favicon',
                'api/v2.1/admin/login-background-image',
            ],
            'can_manage_library': [
                'sys/seafadmin/transfer',
                'sys/seafadmin/delete',
                'api/v2.1/admin/libraries',
                'api/v2.1/admin/system-library',
                'api/v2.1/admin/default-library',
                'api/v2.1/admin/trash-libraries',
            ],
            'can_manage_user': [
                'sys/useradmin',
                'sys/useradmin/export-excel',
                'sys/useradmin/ldap',
                'sys/useradmin/ldap/imported',
                'sys/useradmin/admins',
                'useradmin/add',
                'useradmin/remove',
                'useradmin/removetrial',
                'useradmin/search',
                'useradmin/removeadmin',
                'useradmin/info',
                'useradmin/toggle_status',
                'useradmin/toggle_role',
                'useradmin', # for 'useradmin/(?P<email>[^/]+)/set_quota',
                'useradmin/password/reset',
                'useradmin/batchmakeadmin',
                'useradmin/batchadduser',
                'api/v2.1/admin/users/batch',
            ],
            'can_manage_group': [
                'sys/groupadmin/export-excel',
                'api/v2.1/admin/groups',
            ],
            'can_manage_external_link': [
                'sys/external-links/',
                'api/v2.1/admin/external-links',
            ],
            'can_view_user_log': [
                'sys/loginadmin',
                'sys/loginadmin/export-excel',
                'sys/log/fileaudit',
                'sys/log/emailaudit',
                'sys/log/fileaudit/export-excel',
                'sys/log/fileupdate',
                'sys/log/fileupdate/export-excel',
                'sys/log/permaudit',
                'sys/log/permaudit/export-excel',
                'api/v2.1/admin/logs/login',
                'api/v2.1/admin/logs/file-audit',
                'api/v2.1/admin/logs/file-update',
                'api/v2.1/admin/logs/perm-audit',
            ],
            'can_view_admin_log': [
                'api/v2.1/admin/admin-logs',
                'api/v2.1/admin/admin-login-logs',
            ],
        }

        request_path = request.path
        def get_permission_by_request_path(request_path, permission_url):
            for permission, url_list in permission_url.items():
                for url in url_list:
                    if url in request_path:
                        return permission

        permission = get_permission_by_request_path(request_path,
                permission_url)

        if permission == 'can_view_system_info':
            if not request.user.admin_permissions.can_view_system_info():
                return HttpResponseForbidden()
        elif permission == 'can_view_statistic':
            if not request.user.admin_permissions.can_view_statistic():
                return HttpResponseForbidden()
        elif permission == 'can_config_system':
            if not request.user.admin_permissions.can_config_system():
                return HttpResponseForbidden()
        elif permission == 'can_manage_library':
            if not request.user.admin_permissions.can_manage_library():
                return HttpResponseForbidden()
        elif permission == 'can_manage_user':
            if not request.user.admin_permissions.can_manage_user():
                return HttpResponseForbidden()
        elif permission == 'can_manage_group':
            if not request.user.admin_permissions.can_manage_group():
                return HttpResponseForbidden()
        elif permission == 'can_manage_external_link':
            if not request.user.admin_permissions.can_manage_external_link():
                return HttpResponseForbidden()
        elif permission == 'can_view_user_log':
            if not request.user.admin_permissions.can_view_user_log():
                return HttpResponseForbidden()
        elif permission == 'can_view_admin_log':
            if not request.user.admin_permissions.can_view_admin_log():
                return HttpResponseForbidden()
        else:
            return None


class UserAgentMiddleWare(object):
    user_agents_test_match = (
        "w3c ", "acs-", "alav", "alca", "amoi", "audi",
        "avan", "benq", "bird", "blac", "blaz", "brew",
        "cell", "cldc", "cmd-", "dang", "doco", "eric",
        "hipt", "inno", "ipaq", "java", "jigs", "kddi",
        "keji", "leno", "lg-c", "lg-d", "lg-g", "lge-",
        "maui", "maxo", "midp", "mits", "mmef", "mobi",
        "mot-", "moto", "mwbp", "nec-", "newt", "noki",
        "xda",  "palm", "pana", "pant", "phil", "play",
        "port", "prox", "qwap", "sage", "sams", "sany",
        "sch-", "sec-", "send", "seri", "sgh-", "shar",
        "sie-", "siem", "smal", "smar", "sony", "sph-",
        "symb", "t-mo", "teli", "tim-", "tosh", "tsm-",
        "upg1", "upsi", "vk-v", "voda", "wap-", "wapa",
        "wapi", "wapp", "wapr", "webc", "winw", "xda-",)
    user_agents_test_search = u"(?:%s)" % u'|'.join((
        'up.browser', 'up.link', 'mmp', 'symbian', 'smartphone', 'midp',
        'wap', 'phone', 'windows ce', 'pda', 'mobile', 'mini', 'palm',
        'netfront', 'opera mobi',
    ))
    user_agents_exception_search = u"(?:%s)" % u'|'.join((
        'ipad',
    ))
    http_accept_regex = re.compile("application/vnd\.wap\.xhtml\+xml", re.IGNORECASE)
    user_agents_android_search = u"(?:android)"
    user_agents_mobile_search = u"(?:mobile)"
    user_agents_tablets_search = u"(?:%s)" % u'|'.join(('ipad', 'tablet', ))

    def __init__(self):
        # these for detect mobile
        user_agents_test_match = r'^(?:%s)' % '|'.join(self.user_agents_test_match)
        self.user_agents_test_match_regex = re.compile(user_agents_test_match, re.IGNORECASE)
        self.user_agents_test_search_regex = re.compile(self.user_agents_test_search, re.IGNORECASE)
        self.user_agents_exception_search_regex = re.compile(self.user_agents_exception_search, re.IGNORECASE)

        # these three used to detect tablet
        self.user_agents_android_search_regex = re.compile(self.user_agents_android_search, re.IGNORECASE)
        self.user_agents_mobile_search_regex = re.compile(self.user_agents_mobile_search, re.IGNORECASE)
        self.user_agents_tablets_search_regex = re.compile(self.user_agents_tablets_search, re.IGNORECASE)

    def process_request(self, request):
        is_mobile = False
        is_tablet = False

        if 'HTTP_USER_AGENT' in request.META :
            user_agent = request.META['HTTP_USER_AGENT']

            # Test common mobile values.
            if self.user_agents_test_search_regex.search(user_agent) and \
                not self.user_agents_exception_search_regex.search(user_agent):
                is_mobile = True
            else:
                # Nokia like test for WAP browsers.
                # http://www.developershome.com/wap/xhtmlmp/xhtml_mp_tutorial.asp?page=mimeTypesFileExtension

                if 'HTTP_ACCEPT' in request.META :
                    http_accept = request.META['HTTP_ACCEPT']
                    if self.http_accept_regex.search(http_accept):
                        is_mobile = True

            if not is_mobile:
                # Now we test the user_agent from a big list.
                if self.user_agents_test_match_regex.match(user_agent):
                    is_mobile = True

            # Ipad or Blackberry
            if self.user_agents_tablets_search_regex.search(user_agent):
                is_tablet = True
            # Android-device. If User-Agent doesn't contain Mobile, then it's a tablet
            elif (self.user_agents_android_search_regex.search(user_agent) and
                  not self.user_agents_mobile_search_regex.search(user_agent)):
                is_tablet = True

        request.is_mobile = is_mobile
        request.is_tablet = is_tablet
