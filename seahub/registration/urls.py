# Copyright (c) 2012-2016 Seafile Ltd.
"""
Backwards-compatible URLconf for existing django-registration
installs; this allows the standard ``include('registration.urls')`` to
continue working, but that usage is deprecated and will be removed for
django-registration 1.0. For new installs, use
``include('seahub.registration.urls')``.
"""
from django.conf.urls import url
from django.views.generic import TemplateView
from django.conf import settings

from .views import activate
from .views import register
from .forms import RegistrationForm
from seahub.base.generic import DirectTemplateView
from seahub.two_factor.views.login import TwoFactorVerifyView
from seahub.auth import views as auth_views
try:
    from seahub.settings import CLOUD_MODE
except ImportError:
    CLOUD_MODE = False


form_class = RegistrationForm

urlpatterns = [
    url(r'^activate/complete/$',
        TemplateView.as_view(template_name='registration/activation_complete.html'),
        name='registration_activation_complete'),
    # Activation keys get matched by \w+ instead of the more specific
    # [a-fA-F0-9]{40} because a bad activation key should still get to the view;
    # that way it can return a sensible "invalid key" message instead of a
    # confusing 404.
    url(r'^activate/(?P<activation_key>\w+)/$',
        activate,
        {'backend': 'seahub.registration.backend.RegistrationBackend'},
        name='registration_activate'),

    url(r'^register/$', register,
        {'backend': 'seahub.registration.backend.RegistrationBackend', 'form_class': form_class},
        name='registration_register'),
    url(r'^register/complete/$',
        DirectTemplateView.as_view(template_name='registration/registration_complete.html'),
        name='registration_complete'),
    url(r'^register/closed/$',
        DirectTemplateView.as_view(template_name='registration/registration_closed.html'),
        name='registration_disallowed'),
]

# auth_urls
urlpatterns += [
    url(r'^password/change/$',
        auth_views.password_change,
        name='auth_password_change'),
    url(r'^password/change/done/$',
        auth_views.password_change_done,
        name='auth_password_change_done'),
    url(r'^password/reset/$',
        auth_views.password_reset,
        name='auth_password_reset'),
    url(r'^password/reset/confirm/(?P<uidb36>[0-9A-Za-z]+)-(?P<token>.+)/$',
        auth_views.password_reset_confirm,
        name='auth_password_reset_confirm'),
    url(r'^password/reset/complete/$',
        auth_views.password_reset_complete,
        name='auth_password_reset_complete'),
    url(r'^password/reset/done/$',
        auth_views.password_reset_done,
        name='auth_password_reset_done'),
    url(r'^login/two-factor-auth/$',
        TwoFactorVerifyView.as_view(),
        name='two_factor_auth'),
    url(r'^login/$',
        auth_views.login,
        {'template_name': 'registration/login.html',
         'redirect_if_logged_in': 'dtable'},
        name='auth_login'),
    url(r'^logout/$',
        auth_views.logout,
        {'template_name': 'registration/logout.html',
         'next_page': settings.LOGOUT_REDIRECT_URL},
        name='auth_logout'),
]

if getattr(settings, 'ENABLE_LOGIN_SIMPLE_CHECK', False):
    urlpatterns += [
        url(r'^login/simple_check/$',
            auth_views.login_simple_check),
    ]
