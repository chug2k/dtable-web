# Copyright (c) 2012-2016 Seafile Ltd.
# encoding: utf-8
import hashlib
import os
import stat
import json
import mimetypes
import logging
import posixpath

from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.http import HttpResponse, Http404, \
    HttpResponseRedirect
from django.shortcuts import render, redirect
from django.utils.http import urlquote
from django.utils.html import escape
from django.utils.translation import ugettext as _
from django.views.decorators.http import condition

import seaserv
from seaserv import get_repo, get_commits, \
    seafserv_threaded_rpc, is_repo_owner, \
    get_file_size, MAX_DOWNLOAD_DIR_SIZE, \
    seafile_api, ccnet_api
from pysearpc import SearpcError

from seahub.avatar.util import get_avatar_file_storage
from seahub.auth.decorators import login_required
from seahub.auth import login as auth_login
from seahub.auth import get_backends
from seahub.base.accounts import User
from seahub.base.decorators import require_POST
from seahub.options.models import UserOptions, CryptoOptionNotSetError
from seahub.profile.models import Profile
from seahub.utils import render_permission_error, render_error, \
    gen_shared_upload_link, is_org_context, \
    gen_dir_share_link, gen_file_share_link, get_file_type_and_ext, \
    get_user_repos, EMPTY_SHA1, gen_file_get_url, \
    new_merge_with_no_conflict, get_max_upload_file_size, \
    is_pro_version, is_valid_dirent_name, \
    is_windows_operating_system, IS_EMAIL_CONFIGURED
from seahub.utils.repo import get_library_storages, parse_repo_perm
from seahub.utils.timeutils import utc_to_local
from seahub.utils.auth import get_login_bg_image_path
import seahub.settings as settings
from seahub.settings import AVATAR_FILE_STORAGE, SHARE_LINK_EXPIRE_DAYS_MIN, \
    SHARE_LINK_EXPIRE_DAYS_MAX, SHARE_LINK_EXPIRE_DAYS_DEFAULT, \
    DTABLE_SOCKET_URL, SHOW_WECHAT_SUPPORT_GROUP, SEATABLE_MARKET_URL

from seahub.constants import HASH_URLS, PERMISSION_READ

LIBRARY_TEMPLATES = getattr(settings, 'LIBRARY_TEMPLATES', {})
SEATABLE_VERSION = getattr(settings, 'SEATABLE_VERSION', 'Dev')

from constance import config

# Get an instance of a logger
logger = logging.getLogger(__name__)

def validate_owner(request, repo_id):
    """
    Check whether user in the request owns the repo.

    """
    ret = is_repo_owner(request.user.username, repo_id)

    return True if ret else False

def is_registered_user(email):
    """
    Check whether user is registerd.

    """
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        user = None

    return True if user else False

_default_repo_id = None
def get_system_default_repo_id():
    global _default_repo_id
    if not _default_repo_id:
        try:
            _default_repo_id = seaserv.seafserv_threaded_rpc.get_system_default_repo_id()
        except SearpcError as e:
            logger.error(e)
    return _default_repo_id

def check_folder_permission(request, repo_id, path):
    """Check repo/folder/file access permission of a user.

    Arguments:
    - `request`:
    - `repo_id`:
    - `path`:
    """
    repo_status = seafile_api.get_repo_status(repo_id)
    if repo_status == 1:
        return PERMISSION_READ

    username = request.user.username
    return seafile_api.check_permission_by_path(repo_id, path, username)

def gen_path_link(path, repo_name):
    """
    Generate navigate paths and links in repo page.

    """
    if path and path[-1] != '/':
        path += '/'

    paths = []
    links = []
    if path and path != '/':
        paths = path[1:-1].split('/')
        i = 1
        for name in paths:
            link = '/' + '/'.join(paths[:i])
            i = i + 1
            links.append(link)
    if repo_name:
        paths.insert(0, repo_name)
        links.insert(0, '/')

    zipped = list(zip(paths, links))

    return zipped


def demo(request):
    """
    Login as demo account.
    """
    from django.conf import settings as dj_settings
    if not dj_settings.ENABLE_DEMO_USER:
        raise Http404

    try:
        user = User.objects.get(email=settings.CLOUD_DEMO_USER)
    except User.DoesNotExist:
        logger.warn('CLOUD_DEMO_USER: %s does not exist.' % settings.CLOUD_DEMO_USER)
        raise Http404

    for backend in get_backends():
        user.backend = "%s.%s" % (backend.__module__, backend.__class__.__name__)

    auth_login(request, user)

    redirect_to = settings.SITE_ROOT
    return HttpResponseRedirect(redirect_to)

def list_inner_pub_repos(request):
    """List inner pub repos.
    """
    username = request.user.username
    if is_org_context(request):
        org_id = request.user.org.org_id
        return seafile_api.list_org_inner_pub_repos(org_id)

    if not request.cloud_mode:
        return seafile_api.get_inner_pub_repo_list()

    return []

def i18n(request):
    """
    Set client language preference, lasts for one month

    """
    from django.conf import settings
    next_page = request.META.get('HTTP_REFERER', settings.SITE_ROOT)

    lang = request.GET.get('lang', settings.LANGUAGE_CODE)
    if lang not in [e[0] for e in settings.LANGUAGES]:
        # language code is not supported, use default.
        lang = settings.LANGUAGE_CODE

    # set language code to user profile if user is logged in
    if not request.user.is_anonymous():
        p = Profile.objects.get_profile_by_user(request.user.username)
        if p is not None:
            # update exist record
            p.set_lang_code(lang)
        else:
            # add new record
            Profile.objects.add_or_update(request.user.username, '', '', lang)

    # set language code to client
    res = HttpResponseRedirect(next_page)
    res.set_cookie(settings.LANGUAGE_COOKIE_NAME, lang, max_age=30*24*60*60)
    return res



storage = get_avatar_file_storage()
def latest_entry(request, filename):
    try:
        return storage.modified_time(filename)
    except Exception as e:
        logger.error(e)
        return None

@condition(last_modified_func=latest_entry)
def image_view(request, filename):
    if AVATAR_FILE_STORAGE is None:
        raise Http404

    # read file from cache, if hit
    filename_md5 = hashlib.md5(filename.encode('utf-8')).hexdigest()
    cache_key = 'image_view__%s' % filename_md5
    file_content = cache.get(cache_key)
    if file_content is None:
        # otherwise, read file from database and update cache
        image_file = storage.open(filename, 'rb')
        if not image_file:
            raise Http404
        file_content = image_file.read()
        cache.set(cache_key, file_content, 365 * 24 * 60 * 60)

    # Prepare response
    content_type, content_encoding = mimetypes.guess_type(filename)
    response = HttpResponse(content=file_content, content_type=content_type)
    response['Content-Disposition'] = 'inline; filename=%s' % filename
    if content_encoding:
        response['Content-Encoding'] = content_encoding
    return response

def custom_css_view(request):
    file_content = config.CUSTOM_CSS
    response = HttpResponse(content=file_content, content_type='text/css')
    return response


def fake_view(request, **kwargs):
    """
    Used for 'view_common_lib_dir' and some other urls

    As the urls start with '#',
    http request will not access this function
    """
    return HttpResponse()

def choose_register(request):
    """
    Choose register
    """
    login_bg_image_path = get_login_bg_image_path()

    return render(request, 'choose_register.html', {
        'login_bg_image_path': login_bg_image_path
    })


@login_required
def dtable_fake_view(request, **kwargs):
    return render(request, 'react_dtable.html', {
        'version': SEATABLE_VERSION,
        'show_wechat_support_group': SHOW_WECHAT_SUPPORT_GROUP,
        'seatable_market_url': SEATABLE_MARKET_URL,
        'share_link_expire_days_default': settings.SHARE_LINK_EXPIRE_DAYS_DEFAULT,
        'share_link_expire_days_min': SHARE_LINK_EXPIRE_DAYS_MIN,
        'share_link_expire_days_max': SHARE_LINK_EXPIRE_DAYS_MAX,
    })
