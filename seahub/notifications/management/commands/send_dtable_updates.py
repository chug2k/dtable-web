# Copyright (c) 2012-2016 Seafile Ltd.
# encoding: utf-8
from datetime import datetime
import logging
import json
import os
import re

from django.core.management.base import BaseCommand
from django.core.urlresolvers import reverse
from django.db import connection
from django.utils.html import escape as e
from django.utils import translation
from django.utils.translation import ugettext as _

from seahub.avatar.templatetags.avatar_tags import avatar, api_avatar_url
from seahub.avatar.util import get_default_avatar_url
from seahub.base.templatetags.seahub_tags import email2nickname, email2contact_email
from seahub.constants import HASH_URLS
from seahub.dtable.models import Workspaces, DTables, DTableShare
from seahub.options.models import (
    UserOptions, KEY_DTABLE_UPDATES_EMAIL_INTERVAL,
    KEY_DTABLE_UPDATES_LAST_EMAILED_TIME
)
from seahub.profile.models import Profile
from seahub.utils import (get_site_name,
                          send_html_email, get_site_scheme_and_netloc)
from seahub.utils.timeutils import utc_to_local, utc_datetime_to_isoformat_timestr
from seaserv import ccnet_api

# Get an instance of a logger
logger = logging.getLogger(__name__)

########## Utility Functions ##########
def td(con):
    return con
    # return '<td>%s</td>' % con

def a_tag(con, href='#', style=''):
    return '<a href="%s" style="%s">%s</a>' % (href, style, e(con))

def user_info_url(username):
    p = reverse('user_profile', args=[username])
    return get_site_scheme_and_netloc() + p

def dtable_url(dtable):
    p = reverse ('dtable:dtable_file_view', args=[dtable.workspace.id, dtable.name])
    return get_site_scheme_and_netloc() + p

#######################################


class Command(BaseCommand):
    help = 'Send Email notifications to user if he/she has '
    'dtable updates notices every period of seconds .'
    label = "notifications_send_dtable_updates"

    def handle(self, *args, **options):
        logger.debug('Start sending dtable updates emails...')
        self.stdout.write('[%s] Start sending dtable updates emails...' % str(datetime.now()))
        self.do_action()
        logger.debug('Finish sending dtable updates emails.\n')
        self.stdout.write('[%s] Finish sending dtable updates emails.\n\n' % str(datetime.now()))

    def get_avatar(self, username, default_size=32):
        img_tag = avatar(username, default_size)
        pattern = r'src="(.*)"'
        repl = r'src="%s\1"' % get_site_scheme_and_netloc()
        return re.sub(pattern, repl, img_tag)

    def get_avatar_src(self, username, default_size=32):
        avatar_img = self.get_avatar(username, default_size)
        m = re.search('<img src="(.*?)".*', avatar_img)
        if m:
            return m.group(1)
        else:
            return ''

    def get_default_avatar(self, default_size=32):
        # user default avatar
        img_tag = """<img src="%s" width="%s" height="%s" class="avatar" alt="" />""" % \
                (get_default_avatar_url(), default_size, default_size)
        pattern = r'src="(.*)"'
        repl = r'src="%s\1"' % get_site_scheme_and_netloc()
        return re.sub(pattern, repl, img_tag)

    def get_default_avatar_src(self, default_size=32):
        avatar_img = self.get_default_avatar(default_size)
        m = re.search('<img src="(.*?)".*', avatar_img)
        if m:
            return m.group(1)
        else:
            return ''

    def get_user_language(self, username):
        return Profile.objects.get_user_language(username)

    def get_row_name(self, row_data):
        row_name = ''
        for cell in row_data:
            if (cell['column_key'] == '0000'):
                row_data = cell['value']
        return row_name

    def format_modify_operation(self, activity):
        details = []
        null_value = _('Empty')
        if activity['op_type'] == 'modify_row':
            for item in activity['row_data']:
                if item['column_type'] == 'single-select':
                    options_dict = {op['id']: op['name'] for op in item['column_data']['options']}
                    old_value = options_dict.get(item['old_value'], null_value)
                    value = options_dict.get(item['value'], null_value)
                elif item['column_type'] == 'multiple-select':
                    options_dict = {op['id']: op['name'] for op in item['column_data']['options']}
                    old_value = ', '.join([options_dict[v] for v in item['old_value']]) if item['old_value'] else null_value
                    value = ', '.join([options_dict[v] for v in item['value']]) if item['value'] else null_value
                elif item['column_type'] == 'text':
                    old_value = item['old_value'][:5] if item['old_value'] else null_value
                    value = item['value'][:5] if item['value'] else null_value
                elif item['column_type'] == 'long-text':
                    old_value = item['old_value']['preview'][:5] if item['old_value'] else null_value
                    value = item['value']['preview'][:5] if item['value'] else null_value
                elif item['column_type'] == 'checkbox':
                    old_value = "<input type='checkbox' %s readonly='readonly' />" % ('' if not item['old_value'] else 'checked',)
                    value = "<input type='checkbox' %s readonly='readonly' />" % ('' if not item['value'] else 'checked',)
                elif item['column_type'] == 'number':
                    old_value = item['old_value'] if item['old_value'] != '' else null_value
                    value = item['value'] if item['value'] != '' else null_value
                elif item['column_type'] == 'date':
                    old_value = item['old_value'] if item['old_value'] != '' else null_value
                    value = item['value'] if item['value'] != '' else null_value
                elif item['column_type'] == 'collaborator':
                    old_value = ''.join([a_tag(email2nickname(u), user_info_url(u)) for u in item['old_value']]) if item['old_value'] != '' else null_value
                    value = ''.join([a_tag(email2nickname(u), user_info_url(u)) for u in item['value']]) if item['value'] != '' else null_value
                elif item['column_type'] == 'file':
                    old_value = ' '.join([a_tag(v['name'], v['url']) for v in item['old_value']]) if item['old_value'] else null_value
                    value = ' '.join([a_tag(v['name'], v['url']) for v in item['value']]) if item['value'] else null_value
                elif item['column_type'] == 'image':
                    old_value = ''.join(["<img src='%s' width='32' height='32' />" % i for i in item['old_value']]) if item['old_value'] else null_value
                    value = ''.join(["<img src='%s' width='32' height='32' />" % i for i in item['value']]) if item['value'] else null_value
                elif item['column_type'] == 'link':
                    old_value = ', '.join(item['old_value']) if item['old_value'] else null_value
                    value = ', '.join(item['value']) if item['value'] else null_value
                else:
                    continue
                details.append('%s -> %s' % (old_value, value))
        return details

    def do_action(self):
        emails = []
        user_dtable_updates_email_intervals = []
        for ele in UserOptions.objects.filter(
                option_key=KEY_DTABLE_UPDATES_EMAIL_INTERVAL):
            try:
                user_dtable_updates_email_intervals.append(
                    (ele.email, int(ele.option_val))
                )
                emails.append(ele.email)
            except Exception as e:
                logger.error(e)
                self.stderr.write('[%s]: %s' % (str(datetime.now()), e))
                continue

        user_last_emailed_time_dict = {}
        for ele in UserOptions.objects.filter(
                option_key=KEY_DTABLE_UPDATES_LAST_EMAILED_TIME).filter(
                    email__in=emails):
            try:
                user_last_emailed_time_dict[ele.email] = datetime.strptime(
                    ele.option_val, "%Y-%m-%d %H:%M:%S")
            except Exception as e:
                logger.error(e)
                self.stderr.write('[%s]: %s' % (str(datetime.now()), e))
                continue

        for (username, interval_val) in user_dtable_updates_email_intervals:
            # save current language
            cur_language = translation.get_language()

            # get and active user language
            user_language = self.get_user_language(username)
            translation.activate(user_language)
            logger.debug('Set language code to %s for user: %s' % (
                user_language, username))
            self.stdout.write('[%s] Set language code to %s for user: %s' % (
                str(datetime.now()), user_language, username))

            # get last_emailed_time if any, defaults to today 00:00:00.0
            last_emailed_time = user_last_emailed_time_dict.get(username, None)
            now = datetime.utcnow().replace(microsecond=0)
            if not last_emailed_time:
                last_emailed_time = datetime.utcnow().replace(hour=0).replace(
                                    minute=0).replace(second=0).replace(microsecond=0)
            else:
                if (now - last_emailed_time).total_seconds() < interval_val:
                    continue

            # find all the user's tables and groups' tables
            groups = ccnet_api.get_groups(username, return_ancestors=True)
            owner_list = [username] + ['%s@seafile_group' % group.id for group in groups]
            dtables = list(DTables.objects.filter(workspace__owner__in=owner_list))
            # find all tables shared to user
            shared_tables = list(DTableShare.objects.list_by_to_user(username))
            # combine tables
            dtables.extend([item.dtable for item in shared_tables])
            # dtable uuid map
            dtables_uuid_map = {dtable.uuid.hex: dtable for dtable in dtables}

            # query all activities about above dtables with DB SQL
            cursor = connection.cursor()
            sql = "SELECT a.* FROM activities a JOIN user_activities ua ON a.id=ua.activity_id WHERE ua.timestamp > %s AND ua.username=%s ORDER BY ua.timestamp DESC"
            cursor.execute(sql, (last_emailed_time, username))  # time and username
            col_names = [desc[0] for desc in cursor.description]
            activities, activities_count = [], 0
            for activity in cursor.fetchall():
                activity = dict(zip(col_names, activity))
                if activity['dtable_uuid'] not in dtables_uuid_map:
                    continue
                activity_detail = json.loads(activity['detail'])
                activity_dict = dict(dtable_uuid=activity['dtable_uuid'])
                activity_dict['dtable_name'] = dtables_uuid_map[activity['dtable_uuid']].name if activity['dtable_uuid'] in dtables_uuid_map else ''
                activity_dict['row_id'] = activity['row_id']
                activity_dict['op_type'] = activity['op_type']
                activity_dict['author_email'] = activity['op_user']
                activity_dict['author_name'] = email2nickname(activity['op_user'])
                activity_dict['author_contact_email'] = email2contact_email(activity['op_user'])
                activity_dict['op_time'] = utc_datetime_to_isoformat_timestr(activity['op_time'])
                activity_dict['table_id'] = activity_detail['table_id']
                activity_dict['table_name'] = activity_detail['table_name']
                activity_dict['row_data'] = activity_detail['row_data']
                activity_dict['row_name'] = self.get_row_name(activity_dict['row_data']) or activity_detail.get('row_name', '')  # compatible with previous data
                avatar_size = 72  # todo: size
                url, is_default, date_uploaded = api_avatar_url(activity['op_user'], avatar_size)
                activity_dict['avatar_url'] = url

                # fields for html-display
                activity_dict['op_user_link'] = a_tag(activity_dict['author_name'], 
                                                     user_info_url(activity['op_user']))
                activity_dict['dtable_link'] = a_tag(activity_dict['dtable_name'], 
                                                    dtable_url(dtables_uuid_map[activity_dict['dtable_uuid']]))
                activity_dict['details'] = self.format_modify_operation(activity_dict)
                activity_dict['local_timestamp'] = utc_to_local(activity['op_time'])

                activities_count += 1
                if len(activities) <= 100:
                    activities.append(activity_dict)

            if not activities:
                translation.activate(cur_language)
                continue

            c = {
                'name': email2nickname(username),
                'updates_count': activities_count,
                'updates': activities,
            }

            contact_email = email2contact_email(username)
            try:
                send_html_email(_('New table updates on %s') % get_site_name(),
                                'notifications/dtable_updates_email.html', c,
                                None, [contact_email])
                now = datetime.utcnow().replace(microsecond=0)
                UserOptions.objects.set_dtable_updates_last_emailed_time(
                    username, now)
            except Exception as e:
                logger.error('Failed to send email to %s, error detail: %s' %
                             (contact_email, e))
                self.stderr.write('[%s] Failed to send email to %s, error '
                                  'detail: %s' % (str(datetime.now()), contact_email, e))
            finally:
                # reset lang
                translation.activate(cur_language)
