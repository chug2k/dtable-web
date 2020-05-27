# Copyright (c) 2012-2016 Seafile Ltd.
# encoding: utf-8
# Utility functions for api2

import os
import time
import json
import re
import logging

from collections import defaultdict
from functools import wraps

from django.core.paginator import EmptyPage, InvalidPage
from django.http import HttpResponse
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status, serializers
from seaserv import seafile_api, get_personal_groups_by_user, \
        get_group, seafserv_threaded_rpc
from pysearpc import SearpcError

from seahub.base.accounts import User
from seahub.base.templatetags.seahub_tags import email2nickname, \
    translate_seahub_time, file_icon_filter, email2contact_email
from seahub.group.views import is_group_staff
from seahub.group.utils import is_group_member
from seahub.notifications.models import UserNotification
from seahub.utils import get_file_type_and_ext, \
    gen_file_get_url, get_site_scheme_and_netloc
from seahub.utils.paginator import Paginator
from seahub.utils.file_types import IMAGE
from seahub.api2.models import Token, TokenV2, DESKTOP_PLATFORMS
from seahub.avatar.settings import AVATAR_DEFAULT_SIZE
from seahub.avatar.templatetags.avatar_tags import api_avatar_url, \
    get_default_avatar_url
from seahub.profile.models import Profile

from seahub.settings import INSTALLED_APPS

logger = logging.getLogger(__name__)

def api_error(code, msg):
    err_resp = {'error_msg': msg}
    return Response(err_resp, status=code)

def get_file_size(store_id, repo_version, file_id):
    size = seafile_api.get_file_size(store_id, repo_version, file_id)
    return size if size else 0

def get_groups(email):
    group_json = []

    joined_groups = get_personal_groups_by_user(email)
    grpmsgs = {}
    for g in joined_groups:
        grpmsgs[g.id] = 0

    notes = UserNotification.objects.get_user_notifications(email, seen=False)
    replynum = 0
    for n in notes:
        if n.is_group_msg():
            try:
                gid  = n.group_message_detail_to_dict().get('group_id')
            except UserNotification.InvalidDetailError:
                continue
            if gid not in grpmsgs:
                continue
            grpmsgs[gid] = grpmsgs[gid] + 1

    for g in joined_groups:
        msg = GroupMessage.objects.filter(group_id=g.id).order_by('-timestamp')[:1]
        mtime = 0
        if len(msg) >= 1:
            mtime = get_timestamp(msg[0].timestamp)
        group = {
            "id": g.id,
            "name": g.group_name,
            "creator": g.creator_name,
            "ctime": g.timestamp,
            "mtime": mtime,
            "msgnum": grpmsgs[g.id],
            }
        group_json.append(group)

    return group_json, replynum


def get_timestamp(msgtimestamp):
    if not msgtimestamp:
        return 0
    timestamp = int(time.mktime(msgtimestamp.timetuple()))
    return timestamp

def api_group_check(func):
    """
    Decorator for initial group permission check tasks

    un-login user & group not pub --> login page
    un-login user & group pub --> view_perm = "pub"
    login user & non group member & group not pub --> public info page
    login user & non group member & group pub --> view_perm = "pub"
    group member --> view_perm = "joined"
    sys admin --> view_perm = "sys_admin"
    """
    def _decorated(view, request, group_id, *args, **kwargs):
        group_id_int = int(group_id) # Checked by URL Conf
        group = get_group(group_id_int)
        if not group:
            return api_error(status.HTTP_404_NOT_FOUND, 'Group not found.')
        group.is_staff = False
        if PublicGroup.objects.filter(group_id=group.id):
            group.is_pub = True
        else:
            group.is_pub = False

        joined = is_group_member(group_id_int, request.user.username)
        if joined:
            group.view_perm = "joined"
            group.is_staff = is_group_staff(group, request.user)
            return func(view, request, group, *args, **kwargs)
        if request.user.is_staff:
            # viewed by system admin
            group.view_perm = "sys_admin"
            return func(view, request, group, *args, **kwargs)

        if group.is_pub:
            group.view_perm = "pub"
            return func(view, request, group, *args, **kwargs)

        # Return group public info page.
        return api_error(status.HTTP_403_FORBIDDEN, 'Forbid to access this group.')

    return _decorated

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', '')

    return ip


JSON_CONTENT_TYPE = 'application/json; charset=utf-8'
def json_response(func):
    @wraps(func)
    def wrapped(*a, **kw):
        result = func(*a, **kw)
        if isinstance(result, HttpResponse):
            return result
        else:
            return HttpResponse(json.dumps(result), status=200,
                                content_type=JSON_CONTENT_TYPE)
    return wrapped

def get_token_v1(username):
    token, _ = Token.objects.get_or_create(user=username)
    return token

_ANDROID_DEVICE_ID_PATTERN = re.compile('^[a-f0-9]{1,16}$')
def get_token_v2(request, username, platform, device_id, device_name,
                 client_version, platform_version):

    if platform in DESKTOP_PLATFORMS:
        # desktop device id is the peer id, so it must be 40 chars
        if len(device_id) != 40:
            raise serializers.ValidationError('invalid device id')

    elif platform == 'android':
        # See http://developer.android.com/reference/android/provider/Settings.Secure.html#ANDROID_ID
        # android device id is the 64bit secure id, so it must be 16 chars in hex representation
        # but some user reports their device ids are 14 or 15 chars long. So we relax the validation.
        if not _ANDROID_DEVICE_ID_PATTERN.match(device_id.lower()):
            raise serializers.ValidationError('invalid device id')
    elif platform == 'ios':
        if len(device_id) != 36:
            raise serializers.ValidationError('invalid device id')
    else:
        raise serializers.ValidationError('invalid platform')

    return TokenV2.objects.get_or_create_token(
        username, platform, device_id, device_name,
        client_version, platform_version, get_client_ip(request))

def get_api_token(request, keys=None, key_prefix='shib_'):

    if not keys:
        keys = [
            'platform',
            'device_id',
            'device_name',
            'client_version',
            'platform_version',
        ]

    if key_prefix:
        keys = [key_prefix + item for item in keys]

    if all([key in request.GET for key in keys]):

        platform = request.GET['%splatform' % key_prefix]
        device_id = request.GET['%sdevice_id' % key_prefix]
        device_name = request.GET['%sdevice_name' % key_prefix]
        client_version = request.GET['%sclient_version' % key_prefix]
        platform_version = request.GET['%splatform_version' % key_prefix]

        token = get_token_v2(request, request.user.username, platform,
                             device_id, device_name, client_version,
                             platform_version)
    else:
        token = get_token_v1(request.user.username)

    return token

def to_python_boolean(string):
    """Convert a string to boolean.
    """
    string = string.lower()
    if string in ('t', 'true', '1'):
        return True
    if string in ('f', 'false', '0'):
        return False
    raise ValueError("Invalid boolean value: '%s'" % string)

def is_seafile_pro():
    return any(['seahub_extra' in app for app in INSTALLED_APPS])

def get_user_common_info(email, avatar_size=AVATAR_DEFAULT_SIZE):
    avatar_url, is_default, date_uploaded = api_avatar_url(email, avatar_size)
    return {
        "email": email,
        "name": email2nickname(email),
        "contact_email": email2contact_email(email),
        "avatar_url": avatar_url
    }

def user_to_dict(email, request=None, avatar_size=AVATAR_DEFAULT_SIZE):
    d = get_user_common_info(email, avatar_size)
    return {
        'user_name': d['name'],
        'user_email': d['email'],
        'user_contact_email': d['contact_email'],
        'avatar_url': d['avatar_url'],
    }

def is_web_request(request):
    if isinstance(request.successful_authenticator, SessionAuthentication):
        return True
    else:
        return False
