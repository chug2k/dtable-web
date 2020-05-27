# Copyright (c) 2012-2019 Seafile Ltd.
# encoding: utf-8
from django.conf import settings

# # weixin base
ENABLE_WEIXIN = getattr(settings, 'ENABLE_WEIXIN', False)
WEIXIN_APP_ID = getattr(settings, 'WEIXIN_APP_ID', '')
WEIXIN_APP_SECRET = getattr(settings, 'WEIXIN_APP_SECRET', '')
WEIXIN_ACCESS_TOKEN_URL = getattr(settings, 'WEIXIN_ACCESS_TOKEN_URL',
                                       'https://api.weixin.qq.com/sns/oauth2/access_token')

# # weixin oauth
WEIXIN_UID_PREFIX = WEIXIN_APP_ID + '_'
WEIXIN_USER_INFO_AUTO_UPDATE = getattr(settings, 'WEIXIN_USER_INFO_AUTO_UPDATE', True)
WEIXIN_AUTHORIZATION_URL = getattr(settings, 'WEIXIN_AUTHORIZATION_URL',
                                        'https://open.weixin.qq.com/connect/qrconnect')
WEIXIN_GET_USER_INFO_URL = getattr(settings, 'WEIXIN_GET_USER_INFO_URL',
                                        'https://api.weixin.qq.com/sns/userinfo')

# # mp weixin as Media Platform Weixin, oauth in mobile weixin client
MP_WEIXIN_APP_ID = getattr(settings, 'MP_WEIXIN_APP_ID', '')
MP_WEIXIN_APP_SECRET = getattr(settings, 'MP_WEIXIN_APP_SECRET', '')
MP_WEIXIN_AUTHORIZATION_URL = getattr(settings, 'MP_WEIXIN_AUTHORIZATION_URL',
                                        'https://open.weixin.qq.com/connect/oauth2/authorize')

# # constants

WEIXIN_PROVIDER = 'weixin'
REMEMBER_ME = True
