# Copyright (c) 2012-2019 Seafile Ltd.
# encoding: utf-8

from django.conf.urls import url
from seahub.weixin.views import weixin_oauth_login, weixin_oauth_callback, \
    weixin_oauth_connect, weixin_oauth_connect_callback, weixin_oauth_disconnect

urlpatterns = [
    url(r'oauth-login/$', weixin_oauth_login, name='weixin_oauth_login'),
    url(r'oauth-callback/$', weixin_oauth_callback, name='weixin_oauth_callback'),
    url(r'oauth-connect/$', weixin_oauth_connect, name='weixin_oauth_connect'),
    url(r'oauth-connect-callback/$', weixin_oauth_connect_callback, name='weixin_oauth_connect_callback'),
    url(r'oauth-disconnect/$', weixin_oauth_disconnect, name='weixin_oauth_disconnect'),
]
