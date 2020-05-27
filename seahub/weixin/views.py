# Copyright (c) 2012-2019 Seafile Ltd.
# encoding: utf-8

import uuid
import logging
import requests
import urllib.request, urllib.parse, urllib.error

from django.shortcuts import render
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.utils.translation import ugettext as _

from seaserv import ccnet_api

from seahub.auth.decorators import login_required
from seahub.utils import get_site_scheme_and_netloc
from seahub.api2.utils import get_api_token
from seahub import auth, settings
from seahub.utils import render_error
from seahub.base.accounts import User
from seahub.weixin.settings import WEIXIN_AUTHORIZATION_URL, WEIXIN_APP_ID, \
    WEIXIN_PROVIDER, WEIXIN_GET_USER_INFO_URL, WEIXIN_UID_PREFIX, \
    WEIXIN_USER_INFO_AUTO_UPDATE, REMEMBER_ME, MP_WEIXIN_APP_ID, \
    MP_WEIXIN_AUTHORIZATION_URL
from seahub.weixin.utils import weixin_check, get_weixin_access_token_and_openid, \
    handler_weixin_api_response, update_weixin_user_info, get_weixin_api_user_info, \
    mp_weixin_check
from seahub.utils.auth import gen_user_virtual_id, VIRTUAL_ID_EMAIL_DOMAIN
from seahub.auth.models import SocialAuthUser
from seahub.profile.models import Profile
from seahub.organizations.settings import ORG_MEMBER_QUOTA_ENABLED

logger = logging.getLogger(__name__)
redirect_to = settings.LOGIN_REDIRECT_URL

# # uid = appid + '_' + unionid


def weixin_oauth_login(request):
    if not weixin_check():
        return render_error(request, _('Feature is not enabled.'))

    # org invite for new user
    org_token = request.GET.get('org_token', None)
    org_id = None
    if org_token:
        # validate token
        org_id = cache.get('org_associate_%s' % org_token, -1)
        if org_id <= 0:
            return render_error(request, '邀请链接无效')
        # get org info
        org = ccnet_api.get_org_by_id(org_id)
        if not org:
            return render_error(request, '机构不存在')
        # check org member quota
        if ORG_MEMBER_QUOTA_ENABLED:
            from seahub.organizations.models import OrgMemberQuota
            org_members = len(ccnet_api.get_org_users_by_url_prefix(org.url_prefix, -1, -1))
            org_members_quota = OrgMemberQuota.objects.get_quota(org_id)
            if org_members_quota is not None and org_members >= org_members_quota:
                return render_error(request, _("Out of quota."))

    # already authenticated
    if request.user.is_authenticated():
        if org_id:
            return render_error(request, '仅限新用户加入机构')
        else:
            return HttpResponseRedirect(request.GET.get(auth.REDIRECT_FIELD_NAME, redirect_to))

    # mobile weixin
    user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
    if 'mobile' in user_agent and 'micromessenger' not in user_agent:
        return render(request, 'redirect_mobile_weixin.html')

    if 'micromessenger' in user_agent:
        if not mp_weixin_check():
            return render_error(request, '微信客户端登录功能未启用，请联系管理员')

        is_mobile_weixin = True
        scope = 'snsapi_userinfo'
        weixin_authorization_url = MP_WEIXIN_AUTHORIZATION_URL
        appid = MP_WEIXIN_APP_ID
    else:
        is_mobile_weixin = False
        scope = 'snsapi_login'
        weixin_authorization_url = WEIXIN_AUTHORIZATION_URL
        appid = WEIXIN_APP_ID

    # main
    state = str(uuid.uuid4())
    request.session['weixin_oauth_state'] = state
    request.session['weixin_oauth_redirect'] = request.GET.get(auth.REDIRECT_FIELD_NAME, redirect_to)
    request.session['weixin_oauth_org_id'] = org_id
    request.session['weixin_oauth_is_mobile_weixin'] = is_mobile_weixin

    response_type = 'code'  # from weixn official document
    wechat_redirect = '#wechat_redirect'

    data = {
        'appid': appid,
        'redirect_uri': get_site_scheme_and_netloc() + reverse('weixin_oauth_callback'),
        'response_type': response_type,
        'scope': scope,
        'state': state,
    }
    authorization_url = weixin_authorization_url + '?' + urllib.parse.urlencode(data) + wechat_redirect

    return HttpResponseRedirect(authorization_url)


def weixin_oauth_callback(request):
    if not weixin_check():
        return render_error(request, _('Feature is not enabled.'))

    code = request.GET.get('code', None)
    state = request.GET.get('state', None)

    weixin_oauth_state = request.session.get('weixin_oauth_state', None)
    weixin_oauth_redirect = request.session.get('weixin_oauth_redirect', redirect_to)
    org_id = request.session.get('weixin_oauth_org_id', None)
    is_mobile_weixin = request.session.get('weixin_oauth_is_mobile_weixin', False)
    # clear session
    try:
        del request.session['weixin_oauth_state']
        del request.session['weixin_oauth_redirect']
        del request.session['weixin_oauth_org_id']
        del request.session['weixin_oauth_is_mobile_weixin']
    except Exception as e:
        logger.warning(e)

    # get api user info
    if state != weixin_oauth_state or not code:
        logger.error('can not get right code or state from weixin request')
        return render_error(request, _('Error, please contact administrator.'))

    access_token, openid = get_weixin_access_token_and_openid(code, is_mobile_weixin)
    if not access_token or not openid:
        logger.error('can not get weixin access_token or openid')
        return render_error(request, _('Error, please contact administrator.'))

    weixin_api_user_info = get_weixin_api_user_info(access_token, openid)
    if not weixin_api_user_info:
        return render_error(request, _('Error, please contact administrator.'))

    # main
    user_id = weixin_api_user_info.get('unionid')
    uid = WEIXIN_UID_PREFIX + user_id

    weixin_user = SocialAuthUser.objects.get_by_provider_and_uid(WEIXIN_PROVIDER, uid)
    if weixin_user:
        email = weixin_user.username
        is_new_user = False
    else:
        email = None
        is_new_user = True

    try:
        user = auth.authenticate(remote_user=email)
    except User.DoesNotExist:
        user = None

    if not user:
        return render_error(
            request, _('Error, new user registration is not allowed, please contact administrator.'))

    # bind
    username = user.username
    if is_new_user:
        SocialAuthUser.objects.add(username, WEIXIN_PROVIDER, uid)

    # org invite for new user
    if org_id:
        if is_new_user:
            ccnet_api.add_org_user(org_id, username, int(False))
        else:
            return render_error(request, '仅限新用户加入机构')

    # update user info
    if is_new_user or WEIXIN_USER_INFO_AUTO_UPDATE:
        api_user = weixin_api_user_info
        api_user['username'] = username
        update_weixin_user_info(api_user)

    if not user.is_active:
        return render_error(
            request, _('Your account is created successfully, please wait for administrator to activate your account.'))

    # User is valid.  Set request.user and persist user in the session
    # by logging the user in.
    request.user = user
    request.session['remember_me'] = REMEMBER_ME
    auth.login(request, user)

    # generate auth token for Seafile client
    api_token = get_api_token(request)

    # redirect user to page
    response = HttpResponseRedirect(weixin_oauth_redirect)
    response.set_cookie('seahub_auth', user.username + '@' + api_token.key)
    return response


@login_required
def weixin_oauth_connect(request):
    if not weixin_check():
        return render_error(request, _('Feature is not enabled.'))

    # mobile weixin
    user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
    if 'mobile' in user_agent and 'micromessenger' not in user_agent:
        return render_error(request, '请在微信客户端打开链接')

    if 'micromessenger' in user_agent:
        if not mp_weixin_check():
            return render_error(request, '微信客户端登录功能未启用，请联系管理员')

        is_mobile_weixin = True
        scope = 'snsapi_userinfo'
        weixin_authorization_url = MP_WEIXIN_AUTHORIZATION_URL
        appid = MP_WEIXIN_APP_ID
    else:
        is_mobile_weixin = False
        scope = 'snsapi_login'
        weixin_authorization_url = WEIXIN_AUTHORIZATION_URL
        appid = WEIXIN_APP_ID

    state = str(uuid.uuid4())
    request.session['weixin_oauth_connect_state'] = state
    request.session['weixin_oauth_connect_redirect'] = request.GET.get(auth.REDIRECT_FIELD_NAME, redirect_to)
    request.session['weixin_oauth_connect_is_mobile_weixin'] = is_mobile_weixin

    response_type = 'code'  # from weixn official document
    wechat_redirect = '#wechat_redirect'

    data = {
        'appid': appid,
        'redirect_uri': get_site_scheme_and_netloc() + reverse('weixin_oauth_connect_callback'),
        'response_type': response_type,
        'scope': scope,
        'state': state,
    }
    authorization_url = weixin_authorization_url + '?' + urllib.parse.urlencode(data) + wechat_redirect

    return HttpResponseRedirect(authorization_url)


@login_required
def weixin_oauth_connect_callback(request):
    if not weixin_check():
        return render_error(request, _('Feature is not enabled.'))

    code = request.GET.get('code', None)
    state = request.GET.get('state', None)

    weixin_oauth_connect_state = request.session.get('weixin_oauth_connect_state', None)
    weixin_oauth_connect_redirect = request.session.get('weixin_oauth_connect_redirect', redirect_to)
    is_mobile_weixin = request.session.get('weixin_oauth_connect_is_mobile_weixin', False)
    # clear session
    try:
        del request.session['weixin_oauth_connect_state']
        del request.session['weixin_oauth_connect_redirect']
        del request.session['weixin_oauth_connect_is_mobile_weixin']
    except Exception as e:
        logger.warning(e)

    # get api user info
    if state != weixin_oauth_connect_state or not code:
        logger.error('can not get right code or state from weixin request')
        return render_error(request, _('Error, please contact administrator.'))

    access_token, openid = get_weixin_access_token_and_openid(code, is_mobile_weixin)
    if not access_token or not openid:
        logger.error('can not get weixin access_token or openid')
        return render_error(request, _('Error, please contact administrator.'))

    weixin_api_user_info = get_weixin_api_user_info(access_token, openid)
    if not weixin_api_user_info:
        return render_error(request, _('Error, please contact administrator.'))

    # main
    user_id = weixin_api_user_info.get('unionid')
    uid = WEIXIN_UID_PREFIX + user_id
    username = request.user.username

    weixin_user = SocialAuthUser.objects.get_by_provider_and_uid(WEIXIN_PROVIDER, uid)
    if weixin_user:
        logger.error('weixin account already exists %s' % user_id)
        return render_error(request, '出错了，此微信账号已被绑定')

    SocialAuthUser.objects.add(username, WEIXIN_PROVIDER, uid)

    # update user info
    if WEIXIN_USER_INFO_AUTO_UPDATE:
        api_user = weixin_api_user_info
        api_user['username'] = username
        update_weixin_user_info(api_user)

    # redirect user to page
    response = HttpResponseRedirect(weixin_oauth_connect_redirect)
    return response


@login_required
def weixin_oauth_disconnect(request):
    if not weixin_check():
        return render_error(request, _('Feature is not enabled.'))

    username = request.user.username
    if username[-(len(VIRTUAL_ID_EMAIL_DOMAIN)):] == VIRTUAL_ID_EMAIL_DOMAIN:
        profile = Profile.objects.get_profile_by_user(username)
        if not profile or not (profile.contact_email or profile.phone):
            return render_error(request, '出错了，当前账号不能解绑微信，请绑定手机号或邮箱后再试')

    SocialAuthUser.objects.delete_by_username_and_provider(username, WEIXIN_PROVIDER)

    # redirect user to page
    response = HttpResponseRedirect(request.GET.get(auth.REDIRECT_FIELD_NAME, redirect_to))
    return response
