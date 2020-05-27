from django.conf.urls import url

from seahub.saml.views import login, acs


urlpatterns = [
    url(r'^login/', login, name='saml_login'),
    url(r'^acs/$', acs, name="saml_acs"),
]
