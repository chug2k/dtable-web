# Copyright (c) 2012-2016 Seafile Ltd.
import logging

from django.conf import settings
from django.db import models, IntegrityError
from django.core.cache import cache
from django.dispatch import receiver
from django.core.exceptions import MultipleObjectsReturned

from seahub.base.fields import LowerCaseCharField
from seahub.profile.settings import EMAIL_ID_CACHE_PREFIX, EMAIL_ID_CACHE_TIMEOUT
from seahub.institutions.models import Institution
from seahub.registration.signals import user_registered
from seahub.signals import institution_deleted

# Get an instance of a logger
logger = logging.getLogger(__name__)

class DuplicatedContactEmailError(Exception):
    pass


class ProfileManager(models.Manager):
    def add_or_update(self, username, nickname=None, intro=None, lang_code=None,
                      login_id=None, contact_email=None, institution=None, list_in_address_book=None):
        """Add or update user profile.
        """
        try:
            profile = self.get(user=username)
        except Profile.DoesNotExist:
            profile = self.model(user=username)

        if nickname is not None:
            nickname = nickname.strip()
            profile.nickname = nickname
        if intro is not None:
            profile.intro = intro
        if lang_code is not None:
            profile.lang_code = lang_code
        if login_id is not None:
            login_id = login_id.strip()
            profile.login_id = login_id
        if contact_email is not None:
            contact_email = contact_email.strip()
            profile.contact_email = contact_email
        if institution is not None:
            institution = institution.strip()
            profile.institution = institution
        if list_in_address_book is not None:
            profile.list_in_address_book = list_in_address_book.lower() == 'true'

        try:
            profile.save(using=self._db)
            return profile
        except IntegrityError as e:
            raise DuplicatedContactEmailError(e)

    def update_contact_email(self, username, contact_email):
        """
        update contact_email of profile
        """
        try:
            profile = self.get(user=username)
            profile.contact_email = contact_email
        except Profile.DoesNotExist:
            logger.warn('%s profile does not exists' % username)
            return None

        try:
            profile.save(using=self._db)
            return profile
        except IntegrityError as e:
            raise DuplicatedContactEmailError(e)

    def get_profile_by_user(self, username):
        """Get a user's profile.
        """
        try:
            return super(ProfileManager, self).get(user=username)
        except Profile.DoesNotExist:
            return None

    def get_profile_by_contact_email(self, contact_email):
        res =  super(ProfileManager, self).filter(contact_email=contact_email)
        if len(res) > 0:
            if len(res) > 1:
                logger.warning('Repeated contact email %s' % contact_email)
            return res[0]
        else:
            return None

    def get_contact_email_by_user(self, username):
        """Get a user's contact email, use username(login email) if not found.
        """
        p = self.get_profile_by_user(username)
        if p and p.contact_email:
            return p.contact_email

        return None

    def get_username_by_login_id(self, login_id):
        """Convert a user's login id to username(login email).
        """
        if not login_id:
            return None

        try:
            return super(ProfileManager, self).get(login_id=login_id).user
        except Profile.DoesNotExist:
            return None

    def get_username_by_contact_email(self, contact_email):
        """Convert a user's contact_email to username(login email).
        """
        if not contact_email:
            return None

        try:
            return super(ProfileManager, self).get(contact_email=contact_email).user
        except Profile.DoesNotExist:
            return None

    def get_username_by_phone(self, phone):
        if not phone:
            return None

        try:
            user = super(ProfileManager, self).filter(phone=phone).first()
            return user.user if user else None
        except Exception as e:
            logger.error('get username by phone: %s error: %s', phone, e)
            return None

    def convert_login_str_to_username(self, login_str):
        """
        Convert login id or contact email to username(login email).
        Use login_str if login id, contact email and phone are not set.
        """
        converts = [
            self.get_username_by_login_id,
            self.get_username_by_contact_email,
            self.get_username_by_phone
        ]
        for convert in converts:
            username = convert(login_str)
            if username is not None:
                return username
        return login_str

    def get_user_language(self, username):
        """Get user's language from profile. Return default language code if
        user has no preferred language.

        Arguments:
        - `self`:
        - `username`:
        """
        try:
            profile = self.get(user=username)
            if profile.lang_code is not None:
                return profile.lang_code
            else:
                return settings.LANGUAGE_CODE
        except Profile.DoesNotExist:
            return settings.LANGUAGE_CODE

    def delete_profile_by_user(self, username):
        self.filter(user=username).delete()

class Profile(models.Model):
    user = models.EmailField(unique=True)
    nickname = models.CharField(max_length=64, blank=True)
    intro = models.TextField(max_length=256, blank=True)
    lang_code = models.TextField(max_length=50, null=True, blank=True)
    # Login id can be email or anything else used to login.
    login_id = models.CharField(max_length=225, unique=True, null=True, blank=True)
    # Contact email is used to receive emails.
    contact_email = models.EmailField(max_length=225, unique=True, null=True, blank=True)
    institution = models.CharField(max_length=225, db_index=True, null=True, blank=True, default='')
    list_in_address_book = models.BooleanField(default=False, db_index=True)
    phone = models.CharField(max_length=20, db_index=True, unique=True, null=True, blank=True)
    objects = ProfileManager()

    def set_lang_code(self, lang_code):
        self.lang_code = lang_code
        self.save()


########## signal handlers
from django.db.models.signals import post_save
from .utils import refresh_cache

@receiver(user_registered)
def clean_email_id_cache(sender, **kwargs):
    from seahub.utils import normalize_cache_key

    user = kwargs['user']
    key = normalize_cache_key(user.email, EMAIL_ID_CACHE_PREFIX)
    cache.set(key, user.id, EMAIL_ID_CACHE_TIMEOUT)

@receiver(post_save, sender=Profile, dispatch_uid="update_profile_cache")
def update_profile_cache(sender, instance, **kwargs):
    """
    Set profile data to cache when profile data change.
    """
    refresh_cache(instance.user)

@receiver(institution_deleted)
def remove_user_for_inst_deleted(sender, **kwargs):
    inst_name = kwargs.get("inst_name", "")
    Profile.objects.filter(institution=inst_name).update(institution="")

