# Copyright (c) 2012-2016 Seafile Ltd.
import os
import json
import logging
from django.core.cache import cache
from django.core.urlresolvers import reverse

from seaserv import ccnet_api, seafile_api

from seahub.dtable.models import DTables, Workspaces, DTableForms
from seahub.notifications.models import Notification
from seahub.notifications.settings import NOTIFICATION_CACHE_TIMEOUT
from seahub.avatar.templatetags.avatar_tags import api_avatar_url
from seahub.base.templatetags.seahub_tags import email2nickname, email2contact_email

logger = logging.getLogger(__name__)


def refresh_cache():
    """
    Function to be called when change primary notification.
    """
    cache.set('CUR_TOPINFO', Notification.objects.all().filter(primary=1),
              NOTIFICATION_CACHE_TIMEOUT)


def update_notice_detail(request, notices):
    for notice in notices:
        # if need to update this func, command-line's code perhaps
        # needs to be updated, work-weixin-send-notices, email-send-notices, etc...

        if notice.is_add_user_to_group_msg():
            try:
                d = json.loads(notice.detail)
                group_id = d['group_id']
                group = ccnet_api.get_group(group_id)
                if group is None:
                    notice.detail = None
                else:
                    group_staff_email = d.pop('group_staff')
                    url, is_default, date_uploaded = api_avatar_url(group_staff_email, 72)
                    d['group_staff_name'] = email2nickname(group_staff_email)
                    d['group_staff_email'] = group_staff_email
                    d['group_staff_contact_email'] = email2contact_email(group_staff_email)
                    d['group_staff_avatar_url'] = url
                    d['group_name'] = group.group_name

                    notice.detail = d
            except Exception as e:
                logger.error(e)

        elif notice.is_share_dtable_to_user_msg():
            try:
                d = json.loads(notice.detail)
                table_id = d.pop('table_id')
                share_from = d.pop('share_user')
                dtable = DTables.objects.filter(id=table_id).first()
                if not dtable:
                    notice.detail = None
                    continue
                # resource check
                workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace_id)
                if not workspace:
                    notice.detail = None
                    continue
                repo_id = workspace.repo_id
                repo = seafile_api.get_repo(repo_id)
                if not repo:
                    notice.detail = None
                    continue
                if repo.status != 0:
                    notice.detail = None
                    continue
                d['dtable'] = {
                    'id': dtable.id,
                    'workspace_id': dtable.workspace_id,
                    'uuid': dtable.uuid,
                    'name': dtable.name,
                }
                url, is_default, date_uploaded = api_avatar_url(share_from, 72)
                d['share_from'] = {
                    'share_from_user_name': email2nickname(share_from),
                    'share_from_user_email': share_from,
                    'share_from_user_avatar_url': url,
                }
                notice.detail = d
            except Exception as e:
                logger.error(e)

        elif notice.is_submit_form_msg():
            try:
                detail = json.loads(notice.detail)
                dtable_id = detail.pop('dtable_id')
                table_id = detail.pop('table_id')
                form_name = detail.pop('form_name')
                submit_user = detail.pop('submit_user')
                dtable = DTables.objects.filter(id=dtable_id).first()
                if not dtable:
                    notice.detail = None
                    continue
                # resource check
                workspace = Workspaces.objects.get_workspace_by_id(dtable.workspace_id)
                if not workspace:
                    notice.detail = None
                    continue

                detail['form'] = {
                    'id': dtable.id,
                    'workspace_id': dtable.workspace_id,
                    'uuid': dtable.uuid,
                    'name': dtable.name,
                    'table_id': table_id,
                    'form_name': form_name,
                }
                url, is_default, date_uploaded = api_avatar_url(submit_user, 72)
                detail['submit_user'] = {
                    'submit_user_name': email2nickname(submit_user),
                    'submit_user_email': submit_user,
                    'submit_user_avatar_url': url,
                }
                notice.detail = detail
            except Exception as e:
                logger.error(e)

    return notices
