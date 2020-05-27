# Copyright (c) 2012-2016 Seafile Ltd.
import os
import datetime
import logging
from django.db import models
from django.db.models import Q
from django.utils import timezone

from pysearpc import SearpcError
from seaserv import seafile_api

from seahub.auth.signals import user_logged_in
from seahub.utils import calc_file_path_hash, within_time_range, \
        normalize_file_path, normalize_dir_path
from seahub.utils.timeutils import datetime_to_isoformat_timestr
from .fields import LowerCaseCharField


# Get an instance of a logger
logger = logging.getLogger(__name__)


########## misc
class UserLastLoginManager(models.Manager):
    def get_by_username(self, username):
        """Return last login record for a user, delete duplicates if there are
        duplicated records.
        """
        try:
            return self.get(username=username)
        except UserLastLogin.DoesNotExist:
            return None
        except UserLastLogin.MultipleObjectsReturned:
            dups = self.filter(username=username)
            ret = dups[0]
            for dup in dups[1:]:
                dup.delete()
                logger.warn('Delete duplicate user last login record: %s' % username)
            return ret

class UserLastLogin(models.Model):
    username = models.CharField(max_length=255, db_index=True)
    last_login = models.DateTimeField(default=timezone.now)
    objects = UserLastLoginManager()

def update_last_login(sender, user, **kwargs):
    """
    A signal receiver which updates the last_login date for
    the user logging in.
    """
    user_last_login = UserLastLogin.objects.get_by_username(user.username)
    if user_last_login is None:
        user_last_login = UserLastLogin(username=user.username)
    user_last_login.last_login = timezone.now()
    user_last_login.save()
user_logged_in.connect(update_last_login)

class CommandsLastCheck(models.Model):
    """Record last check time for Django/custom commands.
    """
    command_type = models.CharField(max_length=100)
    last_check = models.DateTimeField()
