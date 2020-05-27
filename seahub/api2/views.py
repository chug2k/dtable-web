# Copyright (c) 2012-2016 Seafile Ltd.
# encoding: utf-8
import logging
from importlib import import_module

from rest_framework import parsers
from rest_framework import status
from rest_framework import renderers
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings as dj_settings
from django.utils.translation import ugettext as _

from .throttling import ScopedRateThrottle, AnonRateThrottle, UserRateThrottle
from .authentication import TokenAuthentication
from .serializers import AuthTokenSerializer
from .utils import api_error
from seahub.api2.base import APIView
from seahub.avatar.templatetags.avatar_tags import api_avatar_url
from seahub.base.templatetags.seahub_tags import email2nickname
from seahub.dtable.models import Workspaces
from seahub.options.models import UserOptions
from seahub.profile.models import Profile
from seahub.utils import is_org_context
from seahub.utils.file_size import get_quota_from_string
from seaserv import seafile_api
import seahub.settings as settings

logger = logging.getLogger(__name__)
json_content_type = 'application/json; charset=utf-8'


########## Test
class Ping(APIView):
    """
    Returns a simple `pong` message when client calls `api2/ping/`.
    For example:
        curl http://127.0.0.1:8000/api2/ping/
    """
    throttle_classes = (ScopedRateThrottle, )
    throttle_scope = 'ping'

    def get(self, request, format=None):
        return Response('pong')

    def head(self, request, format=None):
        return Response(headers={'foo': 'bar',})

class AuthPing(APIView):
    """
    Returns a simple `pong` message when client provided an auth token.
    For example:
        curl -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b" http://127.0.0.1:8000/api2/auth/ping/
    """
    authentication_classes = (TokenAuthentication, )
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle, )

    def get(self, request, format=None):
        return Response('pong')

########## Token
class ObtainAuthToken(APIView):
    """
    Returns auth token if username and password are valid.
    For example:
        curl -d "username=foo@example.com&password=123456" http://127.0.0.1:8000/api2/auth-token/
    """
    throttle_classes = (AnonRateThrottle, )
    permission_classes = ()
    parser_classes = (parsers.FormParser, parsers.MultiPartParser, parsers.JSONParser,)
    renderer_classes = (renderers.JSONRenderer,)

    def post(self, request):
        headers = {}
        context = { 'request': request }
        serializer = AuthTokenSerializer(data=request.data, context=context)
        if serializer.is_valid():
            key = serializer.validated_data

            trust_dev = False
            try:
                trust_dev_header = int(request.META.get('HTTP_X_SEAFILE_2FA_TRUST_DEVICE', ''))
                trust_dev = True if trust_dev_header == 1 else False
            except ValueError:
                trust_dev = False

            skip_2fa_header = request.META.get('HTTP_X_SEAFILE_S2FA', None)
            if skip_2fa_header is None:
                if trust_dev:
                    # 2fa login with trust device,
                    # create new session, and return session id.
                    pass
                else:
                    # No 2fa login or 2fa login without trust device,
                    # return token only.
                    return Response({'token': key})
            else:
                # 2fa login without OTP token,
                # get or create session, and return session id
                pass

            SessionStore = import_module(dj_settings.SESSION_ENGINE).SessionStore
            s = SessionStore(skip_2fa_header)
            if not s.exists(skip_2fa_header) or s.is_empty():
                from seahub.two_factor.views.login import remember_device
                s = remember_device(request.data['username'])

            headers = {
                'X-SEAFILE-S2FA': s.session_key
            }
            return Response({'token': key}, headers=headers)

        if serializer.two_factor_auth_failed:
            # Add a special response header so the client knows to ask the user
            # for the 2fa token.
            headers = {
                'X-Seafile-OTP': 'required',
            }

        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST,
                        headers=headers)


class AccountInfo(APIView):
    """ Show account info.
    """
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle, )

    def _get_account_info(self, request):
        info = {}
        email = request.user.username
        p = Profile.objects.get_profile_by_user(email)

        if is_org_context(request):
            org_id = request.user.org.org_id
            is_org_staff = request.user.org.is_staff
            info['is_org_staff'] = is_org_staff
        else:
            quota_total = request.user.permissions.role_asset_quota()
            quota_total = get_quota_from_string(quota_total) if quota_total else -2
            quota_usage = Workspaces.objects.get_owner_total_storage(request.user.username)
            if quota_total is not None and quota_total > 0:
                info['space_usage'] = str(float(quota_usage) / quota_total * 100) + '%'
            else:                       # no space quota set in config
                info['space_usage'] = '0%'
            info['total'] = quota_total
            info['usage'] = quota_usage

        url, _, _ = api_avatar_url(email, int(72))

        info['avatar_url'] = url
        info['email'] = email
        info['name'] = email2nickname(email)
        info['login_id'] = p.login_id if p and p.login_id else ""
        info['contact_email'] = p.contact_email if p else ""
        info['institution'] = p.institution if p and p.institution else ""
        info['is_staff'] = request.user.is_staff

        if getattr(settings, 'MULTI_INSTITUTION', False):
            info['is_inst_admin'] = request.user.inst_admin

        interval = UserOptions.objects.get_dtable_updates_email_interval(email)
        info['email_notification_interval'] = 0 if interval is None else interval
        return info

    def get(self, request, format=None):
        return Response(self._get_account_info(request))

    def put(self, request, format=None):
        """Update account info.
        """
        username = request.user.username

        name = request.data.get("name", None)
        if name is not None:
            if len(name) > 64:
                return api_error(status.HTTP_400_BAD_REQUEST,
                        _('Name is too long (maximum is 64 characters)'))

            if "/" in name:
                return api_error(status.HTTP_400_BAD_REQUEST,
                        _("Name should not include '/'."))

        email_interval = request.data.get("email_notification_interval", None)
        if email_interval is not None:
            try:
                email_interval = int(email_interval)
            except ValueError:
                return api_error(status.HTTP_400_BAD_REQUEST,
                                 'email_interval invalid')

        # update user info

        if name is not None:
            profile = Profile.objects.get_profile_by_user(username)
            if profile is None:
                profile = Profile(user=username)
            profile.nickname = name
            profile.save()

        if email_interval is not None:
            if email_interval <= 0:
                UserOptions.objects.unset_dtable_updates_email_interval(username)
            else:
                UserOptions.objects.set_dtable_updates_email_interval(
                    username, email_interval)

        return Response(self._get_account_info(request))
