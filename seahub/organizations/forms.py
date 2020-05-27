# Copyright (c) 2012-2016 Seafile Ltd.
"""
Forms and validation code for organization user registration.

"""
import re

from django import forms
from django.utils.translation import ugettext_lazy as _
from seaserv import ccnet_api

from seahub.base.accounts import User
from seahub.profile.models import Profile
from seahub.utils import is_valid_username

slug_re = re.compile(r'^[-a-zA-Z0-9_]+$')


class OrgRegistrationForm(forms.Form):
    try:
        from seahub.settings import REGISTRATION_DETAILS_MAP
    except ImportError:
        REGISTRATION_DETAILS_MAP = None

    if REGISTRATION_DETAILS_MAP:
        name_required = REGISTRATION_DETAILS_MAP.get('name', False)
    else:
        name_required = True

    name = forms.CharField(max_length=64, required=name_required)

    email = forms.CharField(max_length=225)
    password1 = forms.CharField()
    password2 = forms.CharField()
    org_name = forms.CharField()

    def clean_email(self):
        email = self.cleaned_data['email'].lower()
        if not is_valid_username(email):
            raise forms.ValidationError(_("Email address is not valid"))

        if Profile.objects.filter(contact_email=email).exists():
            raise forms.ValidationError(_("A user with this email already exists."))

        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            return email

        raise forms.ValidationError(_("A user with this email already exists."))

    def clean(self):
        """
        Verifiy that the values entered into the two password fields
        match. Note that an error here will end up in
        ``non_field_errors()`` because it doesn't apply to a single
        field.
        
        """
        if 'password1' in self.cleaned_data and 'password2' in self.cleaned_data:
            if self.cleaned_data['password1'] != self.cleaned_data['password2']:
                raise forms.ValidationError(_("The two password fields didn't match."))
        return self.cleaned_data
