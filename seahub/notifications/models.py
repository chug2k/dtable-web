# Copyright (c) 2012-2016 Seafile Ltd.
# -*- coding: utf-8 -*-
import datetime
import os
import json
import logging

from django.core.urlresolvers import reverse
from django.db import models
from django.conf import settings
from django.forms import ModelForm, Textarea
from django.utils.html import escape
from django.utils.translation import ugettext as _
from django.core.cache import cache
from django.template.loader import render_to_string

import seaserv
from seaserv import seafile_api, ccnet_api

from seahub.base.fields import LowerCaseCharField
from seahub.base.templatetags.seahub_tags import email2nickname
from seahub.dtable.models import DTables, Workspaces
from seahub.invitations.models import Invitation
from seahub.utils.repo import get_repo_shared_users
from seahub.utils import normalize_cache_key
from seahub.utils.timeutils import datetime_to_isoformat_timestr
from seahub.constants import HASH_URLS

# Get an instance of a logger
logger = logging.getLogger(__name__)


########## system notification
class NotificationManager(models.Manager):
    def create_sys_notification(self, message, is_primary=False):
        """
        Creates and saves a system notification.
        """
        notification = Notification()
        notification.message = message
        notification.primary = is_primary
        notification.save()

        return notification


class Notification(models.Model):
    message = models.CharField(max_length=512)
    primary = models.BooleanField(default=False, db_index=True)
    objects = NotificationManager()

    def update_notification_to_current(self):
        self.primary = 1
        self.save()

class NotificationForm(ModelForm):
    """
    Form for adding notification.
    """
    class Meta:
        model = Notification
        fields = ('message', 'primary')
        widgets = {
            'message': Textarea(),
        }

########## user notification
MSG_TYPE_ADD_USER_TO_GROUP = 'add_user_to_group'
MSG_TYPE_REPO_SHARE = 'repo_share'
MSG_TYPE_REPO_SHARE_TO_GROUP = 'repo_share_to_group'
MSG_TYPE_USER_MESSAGE = 'user_message'
MSG_TYPE_GUEST_INVITATION_ACCEPTED = 'guest_invitation_accepted'
MSG_TYPE_SHARE_DTABLE_TO_USER = 'share_dtable_to_user'
MSG_TYPE_SUBMIT_FORM = 'submit_form'

USER_NOTIFICATION_COUNT_CACHE_PREFIX = 'USER_NOTIFICATION_COUNT_'


def repo_share_msg_to_json(share_from, repo_id, path, org_id):
    return json.dumps({'share_from': share_from, 'repo_id': repo_id,
                       'path': path, 'org_id': org_id})

def repo_share_to_group_msg_to_json(share_from, repo_id, group_id, path, org_id):
    return json.dumps({'share_from': share_from, 'repo_id': repo_id,
                       'group_id': group_id, 'path': path, 'org_id': org_id})

def group_msg_to_json(group_id, msg_from, message):
    return json.dumps({'group_id': group_id, 'msg_from': msg_from,
                       'message': message})

def user_msg_to_json(message, msg_from):
    return json.dumps({'message': message, 'msg_from': msg_from})

def add_user_to_group_to_json(group_staff, group_id):
    return json.dumps({'group_staff': group_staff,
                       'group_id': group_id})

def draft_comment_msg_to_json(draft_id, author, comment):
    return json.dumps({'draft_id': draft_id,
                       'author': author,
                       'comment': comment})

def request_reviewer_msg_to_json(draft_id, from_user, to_user):
    return json.dumps({'draft_id': draft_id,
                       'from_user': from_user,
                       'to_user': to_user})

def guest_invitation_accepted_msg_to_json(invitation_id):
    return json.dumps({'invitation_id': invitation_id})

def repo_transfer_msg_to_json(org_id, repo_owner, repo_id, repo_name):
    """Encode repo transfer message to json string.
    """
    return json.dumps({'org_id': org_id, 'repo_owner': repo_owner,
        'repo_id': repo_id, 'repo_name': repo_name})


def share_dtable_to_user_msg_to_json(table_id, share_user):
    return json.dumps({'table_id': table_id, 'share_user': share_user})


def submit_form_msg_to_json(dtable_id, table_id, form_name, submit_user):
    return json.dumps({'dtable_id': dtable_id,
                       'table_id': table_id,
                       'form_name': form_name,
                       'submit_user': submit_user
                       })

def get_cache_key_of_unseen_notifications(username):
    return normalize_cache_key(username,
            USER_NOTIFICATION_COUNT_CACHE_PREFIX)


class UserNotificationManager(models.Manager):
    def _add_user_notification(self, to_user, msg_type, detail):
        """Add generic user notification.

        Arguments:
        - `self`:
        - `username`:
        - `detail`:
        """
        n = super(UserNotificationManager, self).create(
            to_user=to_user, msg_type=msg_type, detail=detail)
        n.save()

        cache_key = get_cache_key_of_unseen_notifications(to_user)
        cache.delete(cache_key)

        return n

    def get_all_notifications(self, seen=None, time_since=None):
        """Get all notifications of all users.

        Arguments:
        - `self`:
        - `seen`:
        - `time_since`:
        """
        qs = super(UserNotificationManager, self).all()
        if seen is not None:
            qs = qs.filter(seen=seen)
        if time_since is not None:
            qs = qs.filter(timestamp__gt=time_since)
        return qs

    def get_user_notifications(self, username, seen=None):
        """Get all notifications(group_msg, grpmsg_reply, etc) of a user.

        Arguments:
        - `self`:
        - `username`:
        """
        qs = super(UserNotificationManager, self).filter(to_user=username)
        if seen is not None:
            qs = qs.filter(seen=seen)
        return qs

    def remove_user_notifications(self, username):
        """Remove all user notifications.

        Arguments:
        - `self`:
        - `username`:
        """
        self.get_user_notifications(username).delete()

    def count_unseen_user_notifications(self, username):
        """

        Arguments:
        - `self`:
        - `username`:
        """
        return super(UserNotificationManager, self).filter(
            to_user=username, seen=False).count()

    def set_add_user_to_group_notice(self, to_user, detail):
        """

        Arguments:
        - `self`:
        - `to_user`:
        - `detail`:
        """
        return self._add_user_notification(to_user,
                                           MSG_TYPE_ADD_USER_TO_GROUP,
                                           detail)

    def add_repo_share_msg(self, to_user, detail):
        """Notify ``to_user`` that others shared a repo to him/her.

        Arguments:
        - `self`:
        - `to_user`:
        - `repo_id`:
        """
        return self._add_user_notification(to_user,
                                           MSG_TYPE_REPO_SHARE, detail)

    def add_repo_share_to_group_msg(self, to_user, detail):
        """Notify ``to_user`` that others shared a repo to group.

        Arguments:
        - `self`:
        - `to_user`:
        - `detail`:
        """
        return self._add_user_notification(to_user,
                   MSG_TYPE_REPO_SHARE_TO_GROUP, detail)

    def add_user_message(self, to_user, detail):
        """Notify ``to_user`` that others sent a message to him/her.

        Arguments:
        - `self`:
        - `to_user`:
        - `detail`:
        """
        return self._add_user_notification(to_user,
                                           MSG_TYPE_USER_MESSAGE, detail)

    def add_guest_invitation_accepted_msg(self, to_user, detail):
        """Nofity ``to_user`` that a guest has accpeted an invitation.
        """
        return self._add_user_notification(
            to_user, MSG_TYPE_GUEST_INVITATION_ACCEPTED, detail)

    def add_share_dtable_to_user_message(self, to_user, detail):
        return self._add_user_notification(to_user,
                                           MSG_TYPE_SHARE_DTABLE_TO_USER,
                                           detail)

    def add_submit_form_message(self, to_user, detail):
        return self._add_user_notification(to_user,
                                           MSG_TYPE_SUBMIT_FORM,
                                           detail)

class UserNotification(models.Model):
    to_user = LowerCaseCharField(db_index=True, max_length=255)
    msg_type = models.CharField(db_index=True, max_length=30)
    detail = models.TextField()
    timestamp = models.DateTimeField(db_index=True, default=datetime.datetime.now)
    seen = models.BooleanField('seen', default=False)
    objects = UserNotificationManager()

    class InvalidDetailError(Exception):
        pass

    class Meta:
        ordering = ["-timestamp"]

    def __unicode__(self):
        return '%s|%s|%s' % (self.to_user, self.msg_type, self.detail)

    def is_seen(self):
        """Returns value of ``self.seen`` but also changes it to ``True``.

        Use this in a template to mark an unseen notice differently the first
        time it is shown.

        Arguments:
        - `self`:
        """
        seen = self.seen
        if seen is False:
            self.seen = True
            self.save()
        return seen

    def is_repo_share_msg(self):
        """

        Arguments:
        - `self`:
        """
        return self.msg_type == MSG_TYPE_REPO_SHARE

    def is_repo_share_to_group_msg(self):
        """

        Arguments:
        - `self`:
        """
        return self.msg_type == MSG_TYPE_REPO_SHARE_TO_GROUP

    def is_user_message(self):
        """

        Arguments:
        - `self`:
        """
        return self.msg_type == MSG_TYPE_USER_MESSAGE

    def is_add_user_to_group_msg(self):
        """

        Arguments:
        - `self`:
        """
        return self.msg_type == MSG_TYPE_ADD_USER_TO_GROUP

    def is_guest_invitation_accepted_msg(self):
        return self.msg_type == MSG_TYPE_GUEST_INVITATION_ACCEPTED

    def is_share_dtable_to_user_msg(self):
        return self.msg_type == MSG_TYPE_SHARE_DTABLE_TO_USER

    def is_submit_form_msg(self):
        return self.msg_type == MSG_TYPE_SUBMIT_FORM

    def group_message_detail_to_dict(self):
        """Parse group message detail, returns dict contains ``group_id`` and
        ``msg_from``.

        NOTE: ``msg_from`` may be ``None``.

        Arguments:
        - `self`:

        Raises ``InvalidDetailError`` if detail field can not be parsed.
        """
        assert self.is_group_msg()

        try:
            detail = json.loads(self.detail)
        except ValueError:
            raise self.InvalidDetailError('Wrong detail format of group message')
        else:
            if isinstance(detail, int): # Compatible with existing records
                group_id = detail
                msg_from = None
                return {'group_id': group_id, 'msg_from': msg_from}
            elif isinstance(detail, dict):
                group_id = detail['group_id']
                msg_from = detail['msg_from']
                if 'message' in detail:
                    message = detail['message']
                    return {'group_id': group_id, 'msg_from': msg_from, 'message': message}
                else:
                    return {'group_id': group_id, 'msg_from': msg_from}
            else:
                raise self.InvalidDetailError('Wrong detail format of group message')

    def user_message_detail_to_dict(self):
        """Parse user message detail, returns dict contains ``message`` and
        ``msg_from``.

        Arguments:
        - `self`:

        """
        assert self.is_user_message()

        try:
            detail = json.loads(self.detail)
        except ValueError:
            msg_from = self.detail
            message = None
            return {'message': message, 'msg_from': msg_from}
        else:
            message = detail['message']
            msg_from = detail['msg_from']
            return {'message': message, 'msg_from': msg_from}

    ########## functions used in templates
    def format_msg(self):
        if self.is_add_user_to_group_msg():
            return self.format_add_user_to_group()
        elif self.is_share_dtable_to_user_msg():
            return self.format_share_dtable_to_user_msg()
        else:
            return ''

    def format_repo_share_msg(self):
        """

        Arguments:
        - `self`:
        """
        try:
            d = json.loads(self.detail)
        except Exception as e:
            logger.error(e)
            return _("Internal error")

        share_from = email2nickname(d['share_from'])
        repo_id = d['repo_id']
        path = d.get('path', '/')
        org_id = d.get('org_id', None)
        repo = None
        try:
            if path == '/':
                repo = seafile_api.get_repo(repo_id)
            else:
                if org_id:
                    owner = seafile_api.get_org_repo_owner(repo_id)
                    repo = seafile_api.get_org_virtual_repo(
                        org_id, repo_id, path, owner)
                else:
                    owner = seafile_api.get_repo_owner(repo_id)
                    repo = seafile_api.get_virtual_repo(repo_id, path, owner)

        except Exception as e:
            logger.error(e)
            return None

        if repo is None:
            self.delete()
            return None

        if path == '/':
            tmpl = 'notifications/notice_msg/repo_share_msg.html'
        else:
            tmpl = 'notifications/notice_msg/folder_share_msg.html'

        lib_url = reverse('lib_view', args=[repo.id, repo.name, ''])
        msg = render_to_string(tmpl, {
            'user': share_from,
            'lib_url': lib_url,
            'lib_name': repo.name,
        })

        return msg

    def format_repo_share_to_group_msg(self):
        """

        Arguments:
        - `self`:
        """
        try:
            d = json.loads(self.detail)
        except Exception as e:
            logger.error(e)
            return _("Internal error")

        share_from = email2nickname(d['share_from'])
        repo_id = d['repo_id']
        group_id = d['group_id']
        path = d.get('path', '/')
        org_id = d.get('org_id', None)

        repo = None
        try:
            group = ccnet_api.get_group(group_id)
            if path == '/':
                repo = seafile_api.get_repo(repo_id)
            else:
                if org_id:
                    owner = seafile_api.get_org_repo_owner(repo_id)
                    repo = seafile_api.get_org_virtual_repo(
                        org_id, repo_id, path, owner)
                else:
                    owner = seafile_api.get_repo_owner(repo_id)
                    repo = seafile_api.get_virtual_repo(repo_id, path, owner)
        except Exception as e:
            logger.error(e)
            return None

        if not repo or not group:
            self.delete()
            return None

        if path == '/':
            tmpl = 'notifications/notice_msg/repo_share_to_group_msg.html'
        else:
            tmpl = 'notifications/notice_msg/folder_share_to_group_msg.html'

        lib_url = reverse('lib_view', args=[repo.id, repo.name, ''])
        group_url = reverse('group', args=[group.id])
        msg = render_to_string(tmpl, {
            'user': share_from,
            'lib_url': lib_url,
            'lib_name': repo.name,
            'group_url': group_url,
            'group_name': group.group_name,
        })

        return msg

    def format_group_message_title(self):
        """

        Arguments:
        - `self`:
        """
        try:
            d = self.group_message_detail_to_dict()
        except self.InvalidDetailError as e:
            logger.error(e)
            return _("Internal error")

        group_id = d.get('group_id')
        group = ccnet_api.get_group(group_id)
        if group is None:
            self.delete()
            return None

        msg_from = d.get('msg_from')

        if msg_from is None:
            msg = _("<a href='%(href)s'>%(group_name)s</a> has a new discussion.") % {
                'href': HASH_URLS['GROUP_DISCUSS'] % {'group_id': group.id},
                'group_name': group.group_name}
        else:
            msg = _("%(user)s posted a new discussion in <a href='%(href)s'>%(group_name)s</a>.") % {
                'href': HASH_URLS['GROUP_DISCUSS'] % {'group_id': group.id},
                'user': escape(email2nickname(msg_from)),
                'group_name': escape(group.group_name)
            }
        return msg

    def format_group_message_detail(self):
        """

        Arguments:
        - `self`:
        """
        try:
            d = self.group_message_detail_to_dict()
        except self.InvalidDetailError as e:
            logger.error(e)
            return _("Internal error")

        message = d.get('message')
        if message is not None:
            return message
        else:
            return None

    def format_add_user_to_group(self):
        """

        Arguments:
        - `self`:
        """
        try:
            d = json.loads(self.detail)
        except Exception as e:
            logger.error(e)
            return _("Internal error")

        group_staff = d['group_staff']
        group_id = d['group_id']

        group = ccnet_api.get_group(group_id)
        if group is None:
            self.delete()
            return None

        msg = _("User <a href='%(user_profile)s'>%(group_staff)s</a> has added you to group %(group_name)s") % {
            'user_profile': reverse('user_profile', args=[group_staff]),
            'group_staff': escape(email2nickname(group_staff)),
            'group_name': escape(group.group_name)}
        return msg

    def format_draft_comment_msg(self):
        try:
            d = json.loads(self.detail)
        except Exception as e:
            logger.error(e)
            return _("Internal error")

        draft_id = d['draft_id']
        author = d['author']

        msg = _("<a href='%(file_url)s'>Draft #%(draft_id)s</a> has a new comment from user %(author)s") % {
            'draft_id': draft_id,
            'file_url': reverse('drafts:draft', args=[draft_id]),
            'author': escape(email2nickname(author)),
        }
        return msg

    def format_draft_reviewer_msg(self):
        try:
            d = json.loads(self.detail)
        except Exception as e:
            logger.error(e)
            return _("Internal error")

        draft_id = d['draft_id']
        from_user = d['from_user']

        msg = _("%(from_user)s has sent you a request for <a href='%(file_url)s'>draft #%(draft_id)s</a>") % {
            'draft_id': draft_id,
            'file_url': reverse('drafts:draft', args=[draft_id]),
            'from_user': escape(email2nickname(from_user))
        }
        return msg

    def format_guest_invitation_accepted_msg(self):
        try:
            d = json.loads(self.detail)
        except Exception as e:
            logger.error(e)
            return _("Internal error")

        inv_id = d['invitation_id']
        try:
            inv = Invitation.objects.get(pk=inv_id)
        except Invitation.DoesNotExist:
            self.delete()
            return

        # Use same msg as in notice_email.html, so there will be only one msg
        # in django.po.
        msg = _('Guest %(user)s accepted your <a href="%(url_base)s%(inv_url)s">invitation</a> at %(time)s.') % {
            'user': inv.accepter,
            'url_base': '',
            'inv_url': settings.SITE_ROOT + '#invitations/',
            'time': inv.accept_time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        return msg

    def format_repo_transfer_msg(self):
        """

        Arguments:
        - `self`:
        """
        try:
            d = json.loads(self.detail)
        except Exception as e:
            logger.error(e)
            return _("Internal error")

        repo_owner_name = email2nickname(d['repo_owner'])
        repo_id = d['repo_id']
        repo_name = d['repo_name']
        repo_url = reverse('lib_view', args=[repo_id, repo_name, ''])
        msg = _('%(user)s has transfered a library named <a href="%(repo_url)s">%(repo_name)s</a> to you.') % {
            'user': repo_owner_name,
            'repo_url': repo_url,
            'repo_name': repo_name,
        }
        return msg

    def format_share_dtable_to_user_msg(self):
        try:
            d = json.loads(self.detail)
        except Exception as e:
            logger.error('dtable share to user msg notification_id: %s, error: %s', self.id, e)
            return _("Internal error")
        share_from = email2nickname(d['share_user'])
        table_id = d['table_id']
        dtable = DTables.objects.filter(id=table_id).first()
        if not dtable:
            self.delete()
            return None
        # resource check
        workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace_id)
        if not workspace:
            self.delete()
            return None
        repo_id = workspace.repo_id
        repo = seafile_api.get_repo(repo_id)
        if not repo:
            self.delete()
            return None
        if repo.status != 0:
            self.delete()
            return None

        msg = _("%(share_from)s has shared a table named <a href='%(table_link)s'>%(table_name)s</a> to you.") % {
            'share_from': share_from,
            'table_link': reverse('dtable:dtable_file_view', args=[workspace.id, dtable.name]),
            'table_name': dtable.name,
        }
        return msg


########## handle signals
from django.dispatch import receiver

from seahub.group.signals import add_user_to_group
from seahub.dtable.signals import share_dtable_to_user, submit_form
from seahub.invitations.signals import accept_guest_invitation_successful

@receiver(add_user_to_group)
def add_user_to_group_cb(sender, **kwargs):
    group_staff = kwargs['group_staff']
    group_id = kwargs['group_id']
    added_user = kwargs['added_user']

    detail = add_user_to_group_to_json(group_staff,
                                       group_id)

    UserNotification.objects.set_add_user_to_group_notice(to_user=added_user,
                                                          detail=detail)


@receiver(accept_guest_invitation_successful)
def accept_guest_invitation_successful_cb(sender, **kwargs):
    inv_obj = kwargs['invitation_obj']

    detail = guest_invitation_accepted_msg_to_json(inv_obj.pk)
    UserNotification.objects.add_guest_invitation_accepted_msg(
        inv_obj.inviter, detail)


@receiver(share_dtable_to_user)
def share_dtable_to_user_cb(sender, **kwargs):
    table_id = kwargs.get('table_id')
    share_user = kwargs.get('share_user')
    to_user = kwargs.get('to_user')
    detail = share_dtable_to_user_msg_to_json(table_id, share_user)
    UserNotification.objects.add_share_dtable_to_user_message(to_user, detail)

@receiver(submit_form)
def submit_form_cb(sender, **kwargs):
    dtable_id = kwargs.get('dtable_id')
    table_id = kwargs.get('table_id')
    submit_user = kwargs.get('submit_user')
    form_name = kwargs.get('form_name')
    to_user = kwargs.get('to_user')
    detail = submit_form_msg_to_json(dtable_id, table_id, form_name, submit_user)
    UserNotification.objects.add_submit_form_message(to_user, detail)
