# -*- coding: utf-8 -*-
import json
import requests
import logging
from datetime import datetime

from django.db import connection
from django.utils import translation
from django.utils.html import escape
from django.utils.translation import ungettext, ugettext as _
from django.core.management.base import BaseCommand

from seahub.auth.models import SocialAuthUser
from seahub.base.models import CommandsLastCheck
from seahub.dtable.models import DTables
from seahub.utils import get_site_name
from seahub.base.templatetags.seahub_tags import email2nickname
from seahub.settings import DTABLE_WEB_SERVICE_URL
from seahub.work_weixin.utils import work_weixin_notifications_check, \
     get_work_weixin_access_token, handler_work_weixin_api_response
from seahub.work_weixin.settings import WORK_WEIXIN_NOTIFICATIONS_URL, \
     WORK_WEIXIN_PROVIDER, WORK_WEIXIN_UID_PREFIX, WORK_WEIXIN_AGENT_ID

logger = logging.getLogger(__name__)


def format_notice(notice):
    dtable_uuid = notice[2]
    detail = json.loads(notice[5])
    dtable = DTables.objects.get_dtable_by_uuid(dtable_uuid)
    table_name = str(dtable.name)

    message = _("%(author)s added a new comment in table %(table_name)s.") % {
        'author': escape(email2nickname(detail["author"])),
        'table_name': table_name,
    }

    return '<div class="highlight">' + message + '</div>'


class Command(BaseCommand):

    help = 'Send Work WeiXin message to user if he/she has an unread row comment every period of seconds.'
    label = "send_row_comment_notices"

    def handle(self, *args, **options):
        self.log_debug('Start sending work weixin message...')
        self.do_action()
        self.log_debug('Finish sending work weixin message.\n')

    def do_action(self):
        # check before start
        if not work_weixin_notifications_check():
            self.log_error('work weixin notifications settings check failed')
            return

        access_token = get_work_weixin_access_token()
        if not access_token:
            self.log_error('can not get access_token')
            return

        notice_url = WORK_WEIXIN_NOTIFICATIONS_URL + '?access_token=' + access_token
        detail_url = DTABLE_WEB_SERVICE_URL

        # start
        now = datetime.utcnow()
        today = datetime.utcnow().replace(hour=0).replace(minute=0). \
            replace(second=0).replace(microsecond=0)

        # 1. get all users who are connected work weixin
        socials = SocialAuthUser.objects.filter(provider=WORK_WEIXIN_PROVIDER, uid__contains=WORK_WEIXIN_UID_PREFIX)
        users = [(x.username, x.uid[len(WORK_WEIXIN_UID_PREFIX):]) for x in socials]
        self.log_info('Found %d users' % len(users))
        if not users:
            return

        user_uid_map = dict()
        for username, uid in users:
            user_uid_map[username] = uid

        # 2. get previous time that command last runs
        try:
            cmd_last_check = CommandsLastCheck.objects.get(command_type=self.label)
            self.log_debug('Last check time is %s' % cmd_last_check.last_check)

            last_check_dt = cmd_last_check.last_check

            cmd_last_check.last_check = now
            cmd_last_check.save()
        except CommandsLastCheck.DoesNotExist:
            last_check_dt = today
            self.log_debug('Create new last check time: %s' % now)
            CommandsLastCheck(command_type=self.label, last_check=now).save()

        # 3. get all unseen row comments for those users
        user_list = list(user_uid_map.keys())
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM dtable_notifications WHERE created_at > %s"
                           "AND seen = FALSE AND username IN %s", [last_check_dt, user_list])
            rows = cursor.fetchall()

        if len(rows) == 0:
            return
        user_notices = {}
        for row in rows:
            if row[1] not in user_notices:
                user_notices[row[1]] = [row]
            else:
                user_notices[row[1]].append(row)

        cur_language = translation.get_language()
        translation.activate('zh-cn')  # set language to zh-cn
        self.log_info('Set language to zh-cn')

        # 4. send msg to users
        site_name = get_site_name()
        for username, uid in users:
            notices = user_notices.get(username, [])
            count = len(notices)
            if count == 0:
                continue

            title = ungettext(
                "\n"
                "You've got 1 new notice on %(site_name)s:\n",
                "\n"
                "You've got %(num)s new notices on %(site_name)s:\n",
                count
            ) % {'num': count, 'site_name': site_name, }
            content = '\n'.join([format_notice(x) for x in notices])
            self.send_work_weixin_msg(uid, title, content, detail_url, notice_url)

        translation.activate(cur_language)  # reset language
        self.log_info('Reset language success')

    def send_work_weixin_msg(self, uid, title, content, detail_url, notice_url):
        self.log_debug('Send wechat msg to user: %s, msg: %s' % (uid, content))
        data = {
            "touser": uid,
            "agentid": WORK_WEIXIN_AGENT_ID,
            'msgtype': 'textcard',
            'textcard': {
                'title': title,
                'description': content,
                'url': detail_url,
            },
        }
        api_response = requests.post(notice_url, json=data)
        api_response_dic = handler_work_weixin_api_response(api_response)

        if api_response_dic:
            self.log_info(api_response_dic)
        else:
            self.log_error('Can not get work weixin notifications API response')

    def log_debug(self, msg):
        logger.debug(msg)
        self.print_log(msg)

    def log_info(self, msg):
        logger.info(msg)
        self.print_log(msg)

    def log_error(self, msg):
        logger.error(msg)
        self.print_log(msg)

    def print_log(self, msg):
        self.stdout.write('[%s] %s\n' % (str(datetime.now()), msg))
