# Copyright (c) 2012-2016 Seafile Ltd.
# encoding: utf-8
from django.conf import settings
import json
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import render
from django.contrib import messages
from django.utils.translation import ugettext as _

import seaserv
from seaserv import seafile_api

from .forms import ProfileForm
from .models import Profile
from seahub.auth.decorators import login_required
from seahub.utils import is_org_context, is_pro_version, is_valid_username
from seahub.base.accounts import User, UNUSABLE_PASSWORD
from seahub.base.templatetags.seahub_tags import email2nickname
from seahub.options.models import UserOptions, CryptoOptionNotSetError
from seahub.utils import is_ldap_user
from seahub.utils.two_factor_auth import has_two_factor_auth
from seahub.work_weixin.utils import work_weixin_oauth_check
from seahub.weixin.utils import weixin_check
from seahub.settings import ENABLE_DELETE_ACCOUNT, ENABLE_UPDATE_USER_INFO, ENABLE_BIND_PHONE
from seahub.auth.models import SocialAuthUser
from seahub.work_weixin.settings import WORK_WEIXIN_PROVIDER
from seahub.weixin.settings import WEIXIN_PROVIDER


@login_required
def edit_profile(request):
    """
    Show and edit user profile.
    """
    username = request.user.username
    form_class = ProfileForm

    if request.method == 'POST':
        form = form_class(user=request.user, data=request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, _('Successfully edited profile.'))

            return HttpResponseRedirect(reverse('edit_profile'))
        else:
            messages.error(request, _('Failed to edit profile'))
    else:
        profile = Profile.objects.get_profile_by_user(username)

        init_dict = {}
        if profile:
            init_dict['nickname'] = profile.nickname
            init_dict['login_id'] = profile.login_id
            init_dict['contact_email'] = profile.contact_email
            init_dict['list_in_address_book'] = profile.list_in_address_book

        form = form_class(user=request.user, data=init_dict)

    # common logic
    try:
        server_crypto = UserOptions.objects.is_server_crypto(username)
    except CryptoOptionNotSetError:
        # Assume server_crypto is ``False`` if this option is not set.
        server_crypto = False

    sub_lib_enabled = UserOptions.objects.is_sub_lib_enabled(username)

    default_repo_id = UserOptions.objects.get_default_repo(username)
    if default_repo_id:
        default_repo = seafile_api.get_repo(default_repo_id)
    else:
        default_repo = None

    owned_repos = []

    if settings.ENABLE_WEBDAV_SECRET:
        decoded = UserOptions.objects.get_webdav_decoded_secret(username)
        webdav_passwd = decoded if decoded else ''
    else:
        webdav_passwd = ''

    email_inverval = UserOptions.objects.get_dtable_updates_email_interval(username)
    email_inverval = email_inverval if email_inverval is not None else 0

    # social oauth
    enable_work_wixin = False
    enable_wixin = False
    work_wixin_connected = False
    wixin_connected = False

    if work_weixin_oauth_check():
        enable_work_wixin = True
        work_wixin_connected = SocialAuthUser.objects.filter(
            username=request.user.username, provider=WORK_WEIXIN_PROVIDER).exists()
    if weixin_check():
        enable_wixin = True
        wixin_connected = SocialAuthUser.objects.filter(
            username=request.user.username, provider=WEIXIN_PROVIDER).exists()

    resp_dict = {
            'form': form,
            'server_crypto': server_crypto,
            "sub_lib_enabled": sub_lib_enabled,
            'ENABLE_ADDRESSBOOK_OPT_IN': settings.ENABLE_ADDRESSBOOK_OPT_IN,
            'default_repo': default_repo,
            'owned_repos': owned_repos,
            'is_pro': is_pro_version(),
            'is_ldap_user': is_ldap_user(request.user),
            'two_factor_auth_enabled': has_two_factor_auth(),
            'ENABLE_CHANGE_PASSWORD': settings.ENABLE_CHANGE_PASSWORD,
            'ENABLE_WEBDAV_SECRET': settings.ENABLE_WEBDAV_SECRET,
            'ENABLE_DELETE_ACCOUNT': ENABLE_DELETE_ACCOUNT,
            'ENABLE_UPDATE_USER_INFO': ENABLE_UPDATE_USER_INFO,
            'webdav_passwd': webdav_passwd,
            'email_notification_interval': email_inverval,
            'enable_work_wixin': enable_work_wixin,
            'enable_wixin': enable_wixin,
            'work_wixin_connected': work_wixin_connected,
            'wixin_connected': wixin_connected,
            'social_next_page': reverse('edit_profile'),
            'ENABLE_USER_SET_CONTACT_EMAIL': settings.ENABLE_USER_SET_CONTACT_EMAIL,
            'user_unusable_password': request.user.enc_password == UNUSABLE_PASSWORD,
            'enable_bind_phone': ENABLE_BIND_PHONE,
    }

    if has_two_factor_auth():
        from seahub.two_factor.models import StaticDevice, default_device

        try:
            backup_tokens = StaticDevice.objects.get(
                user=request.user.username).token_set.count()
        except StaticDevice.DoesNotExist:
            backup_tokens = 0

        resp_dict['default_device'] = default_device(request.user)
        resp_dict['backup_tokens'] = backup_tokens

    #template = 'profile/set_profile.html'
    template = 'profile/set_profile_react.html'
    return render(request, template, resp_dict)

@login_required
def user_profile(request, username):
    if is_valid_username(username):
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            user = None
    else:
        user = None

    if user is not None:
        nickname = email2nickname(user.username)
        contact_email = Profile.objects.get_contact_email_by_user(user.username)
    else:
        nickname = ''
        contact_email = ''

    return render(request, 'profile/user_profile.html', {
            'user': user,
            'nickname': nickname,
            'contact_email': contact_email,
            })

@login_required
def delete_user_account(request):
    if not ENABLE_DELETE_ACCOUNT:
        messages.error(request, _('Permission denied.'))
        next_page = request.META.get('HTTP_REFERER', settings.SITE_ROOT)
        return HttpResponseRedirect(next_page)

    if request.method != 'POST':
        raise Http404

    username = request.user.username

    if username == 'demo@seafile.com':
        messages.error(request, _('Demo account can not be deleted.'))
        next_page = request.META.get('HTTP_REFERER', settings.SITE_ROOT)
        return HttpResponseRedirect(next_page)

    user = User.objects.get(email=username)
    user.delete()

    if is_org_context(request):
        org_id = request.user.org.org_id
        seaserv.ccnet_threaded_rpc.remove_org_user(org_id, username)

    return HttpResponseRedirect(settings.LOGIN_URL)
