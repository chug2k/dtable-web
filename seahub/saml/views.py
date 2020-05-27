#!/usr/bin/env python
# -*- coding:utf-8 -*-

import logging
from saml2 import (
    BINDING_HTTP_POST,
    BINDING_HTTP_REDIRECT,
    entity,
)
from saml2.client import Saml2Client
from saml2.config import Config as Saml2Config

from django.utils.translation import ugettext as _
from django import get_version
from pkg_resources import parse_version
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseRedirect
from django.utils.http import is_safe_url

from seahub import auth
from seahub.base.accounts import User
from seahub.utils import render_error, get_service_url, is_pro_version

try:
    from seahub.settings import SAML_LOGIN_SETTINGS, SAML_ATTR_MAPPERS
except ImportError:
    SAML_LOGIN_SETTINGS = {}


logger = logging.getLogger(__name__)


def _get_metadata():
    if 'METADATA_LOCAL_FILE_PATH' in SAML_LOGIN_SETTINGS:
        return {
            'local': [SAML_LOGIN_SETTINGS['METADATA_LOCAL_FILE_PATH']]
        }
    else:
        return {
            'remote': [
                {
                    "url": SAML_LOGIN_SETTINGS['METADATA_AUTO_CONF_URL'],
                },
            ]
        }


def _default_next_url():
    return SAML_LOGIN_SETTINGS.get('DEFAULT_NEXT_URL', '/')


def _get_saml_client():
    acs_url = get_service_url().rstrip('/') + '/saml/acs/'
    metadata = _get_metadata()

    saml_settings = {
        'metadata': metadata,
        'service': {
            'sp': {
                'endpoints': {
                    'assertion_consumer_service': [
                        (acs_url, BINDING_HTTP_REDIRECT),
                        (acs_url, BINDING_HTTP_POST)
                    ],
                },
                'allow_unsolicited': True,
                'authn_requests_signed': False,
                'logout_requests_signed': True,
                'want_assertions_signed': False,
                'want_response_signed': False,
            },
        },
    }

    if 'ENTITY_ID' in SAML_LOGIN_SETTINGS:
        saml_settings['entityid'] = settings.SAML_LOGIN_SETTINGS['ENTITY_ID']

    if 'NAME_ID_FORMAT' in SAML_LOGIN_SETTINGS:
        saml_settings['service']['sp']['name_id_format'] = SAML_LOGIN_SETTINGS['NAME_ID_FORMAT']

    spConfig = Saml2Config()
    spConfig.load(saml_settings)
    spConfig.allow_unknown_attributes = True
    saml_client = Saml2Client(config=spConfig)
    return saml_client


@csrf_exempt
def acs(request):
    saml_client = _get_saml_client()
    saml_resp = request.POST.get('SAMLResponse', None)

    if not saml_resp:
        return render_error(request, _('login failed, please contact admin.'))

    authn_response = saml_client.parse_authn_request_response(
            saml_resp, entity.BINDING_HTTP_POST)
    if not authn_response:
        return render_error(request, _('login failed, please contact admin.'))

    user_identity = authn_response.get_identity()
    if not user_identity:
        return render_error(request, _('login failed, please contact admin.'))

    for saml_key, dtable_key in SAML_ATTR_MAPPERS.items():
        if dtable_key == 'contact_email':
            user_email = user_identity.get(saml_key, [''])[0]
        elif dtable_key == 'name':
            username = user_identity.get(saml_key, [''])[0]

    if not user_email:
        return render_error(request, _('login failed, please contact admin.'))

    try:
        user = auth.authenticate(remote_user=user_email, nickname=username)
    except User.DoesNotExist:
        user = None

    if not user or not user.is_active:
        logger.error('User %s not found or inactive.' % user_email)
        # a page for authenticate user failed
        return render_error(request, _('User %s not found.') % user_email)
    # User is valid.  Set request.user and persist user in the session
    # by logging the user in.
    request.user = user
    auth.login(request, user)

    next_url = request.session.get('login_next_url', _default_next_url())
    default_relay_state = '/'

    relay_state = request.POST.get('RelayState', next_url)
    if not relay_state:
        logger.warning('The RelayState parameter exists but is empty')
        relay_state = default_relay_state
    return HttpResponseRedirect(relay_state)


def login(request):
    if not is_pro_version():
        return render_error(request, _('This feature is only in professional version.'))

    if SAML_LOGIN_SETTINGS == {}:
        logger.error('SAML_LOGIN_SETTINGS invalud')
        return render_error(request, _('login failed, please contact admin.'))

    try:
        import urlparse as _urlparse
        from urllib import unquote
    except:
        import urllib.parse as _urlparse
        from urllib.parse import unquote

    next_url = request.GET.get('next', _default_next_url())

    try:
        if 'next=' in unquote(next_url):
            next_url = _urlparse.parse_qs(_urlparse.urlparse(unquote(next_url)).query)['next'][0]
    except:
        next_url = request.GET.get('next', _default_next_url())

    # Only permit signin requests where the next_url is a safe URL
    if parse_version(get_version()) >= parse_version('2.0'):
        url_ok = is_safe_url(next_url, None)
    else:
        url_ok = is_safe_url(next_url)

    if not url_ok:
        return render_error(request, _('login failed, please contact admin.'))

    request.session['login_next_url'] = next_url
    saml_client = _get_saml_client()
    reqid, info = saml_client.prepare_for_authenticate()

    redirect_url = None
    for key, value in info['headers']:
        if key == 'Location':
            redirect_url = value
            break

    return HttpResponseRedirect(redirect_url)

