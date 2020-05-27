from django.db import models
from django.utils import timezone


class UserLoginLogManager(models.Manager):
    def create_login_log(self, username, login_ip, login_success=True):
        l = super(UserLoginLogManager, self).create(username=username,
                                                    login_ip=login_ip, login_success=login_success)
        l.save()
        return l


class UserLoginLog(models.Model):
    username = models.CharField(max_length=255, db_index=True)
    login_date = models.DateTimeField(default=timezone.now, db_index=True)
    login_ip = models.CharField(max_length=128)
    login_success = models.BooleanField(default=True)

    objects = UserLoginLogManager()

    class Meta:
        ordering = ['-login_date']
