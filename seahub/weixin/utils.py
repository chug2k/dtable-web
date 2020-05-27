# Copyright (c) 2012-2019 Seafile Ltd.
# encoding: utf-8

import logging
import json
import requests

from django.core.files.base import ContentFile

from seahub.weixin.settings import WEIXIN_APP_ID, WEIXIN_APP_SECRET, \
    WEIXIN_ACCESS_TOKEN_URL, ENABLE_WEIXIN, WEIXIN_AUTHORIZATION_URL, \
    WEIXIN_GET_USER_INFO_URL, MP_WEIXIN_APP_ID, MP_WEIXIN_APP_SECRET, \
    MP_WEIXIN_AUTHORIZATION_URL
from seahub.profile.models import Profile
from seahub.avatar.models import Avatar

logger = logging.getLogger(__name__)
WEIXIN_ACCESS_TOKEN_CACHE_KEY = 'WEIXIN_ACCESS_TOKEN'


# get access_token: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html

def get_weixin_access_token_and_openid(code, is_mobile_weixin):
    """ get weixin access_token by code
    """
    grant_type = 'authorization_code'  # from weixn official document

    if is_mobile_weixin:
        appid = MP_WEIXIN_APP_ID
        secret = MP_WEIXIN_APP_SECRET
    else:
        appid = WEIXIN_APP_ID
        secret = WEIXIN_APP_SECRET

    data = {
        'appid': appid,
        'secret': secret,
        'code': code,
        'grant_type': grant_type,
    }
    api_response = requests.get(WEIXIN_ACCESS_TOKEN_URL, params=data)
    api_response_dic = handler_weixin_api_response(api_response)
    if not api_response_dic:
        logger.error('can not get weixin response')
        return None, None
    access_token = api_response_dic.get('access_token', None)
    openid = api_response_dic.get('openid', None)

    return access_token, openid


def get_weixin_api_user_info(access_token, openid):
    data = {
        'access_token': access_token,
        'openid': openid,
    }
    api_response = requests.get(WEIXIN_GET_USER_INFO_URL, params=data)
    api_response_dic = handler_weixin_api_response(api_response)
    if not api_response_dic:
        logger.error('can not get weixin user info')

    if not api_response_dic.get('unionid', None):
        logger.error('can not get unionid in weixin user info response')
        api_response_dic = None
    
    return api_response_dic


def handler_weixin_api_response(response):
    """ handler weixin response and errcode
    """
    try:
        response = response.json()
    except ValueError:
        logger.error(response)
        return None

    errcode = response.get('errcode', None)
    if errcode:
        logger.error(json.dumps(response))
        return None
    return response


def weixin_check():
    """ weixin check
    """
    if not ENABLE_WEIXIN:
        return False

    if not WEIXIN_APP_ID \
        or not WEIXIN_APP_SECRET \
        or not WEIXIN_ACCESS_TOKEN_URL \
        or not WEIXIN_AUTHORIZATION_URL \
        or not WEIXIN_GET_USER_INFO_URL:
        logger.error('weixin relevant settings invalid.')
        logger.error('please check WEIXIN_APP_ID, WEIXIN_APP_SECRET')
        logger.error('WEIXIN_ACCESS_TOKEN_URL: %s' % WEIXIN_ACCESS_TOKEN_URL)
        logger.error('WEIXIN_AUTHORIZATION_URL: %s' % WEIXIN_AUTHORIZATION_URL)
        logger.error('WEIXIN_GET_USER_INFO_URL: %s' % WEIXIN_GET_USER_INFO_URL)
        return False

    return True


def mp_weixin_check():
    """ mp weixin check
    """
    if not ENABLE_WEIXIN:
        return False

    if not MP_WEIXIN_APP_ID \
        or not MP_WEIXIN_APP_SECRET \
        or not MP_WEIXIN_AUTHORIZATION_URL:
        logger.error('mp weixin relevant settings invalid.')
        logger.error('please check MP_WEIXIN_APP_ID, MP_WEIXIN_APP_SECRET')
        logger.error('MP_WEIXIN_AUTHORIZATION_URL: %s' % MP_WEIXIN_AUTHORIZATION_URL)
        return False

    return True


def update_weixin_user_info(api_user):
    """ update user profile from weixin

    use for weixin login, bind
    """
    # update additional user info
    username = api_user.get('username')
    nickname = api_user.get('nickname').encode('ISO-8859-1').decode('utf8')
    headimgurl = api_user.get('headimgurl')

    profile_kwargs = {}
    if nickname:
        profile_kwargs['nickname'] = nickname

    if profile_kwargs:
        try:
            Profile.objects.add_or_update(username, **profile_kwargs)
        except Exception as e:
            logger.error(e)

    # avatar

    try:
        image_name = 'weixin_headimgurl'
        image_file = requests.get(headimgurl).content
        avatar = Avatar.objects.filter(emailuser=username, primary=True).first()
        avatar = avatar or Avatar(emailuser=username, primary=True)
        avatar_file = ContentFile(image_file)
        avatar_file.name = image_name
        avatar.avatar = avatar_file
        avatar.save()
    except Exception as e:
        logger.error(e)
