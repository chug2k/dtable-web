# -*- coding: utf-8 -*-
import logging

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication

from seahub.api2.utils import api_error
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.authentication import TokenAuthentication
from seahub.base.templatetags.seahub_tags import email2nickname, email2contact_email
from seahub.avatar.templatetags.avatar_tags import api_avatar_url, api_app_avatar_url
from seahub.utils import DTABLE_EVENTS_ENABLED, get_user_activities
from seahub.dtable.models import DTables
from seahub.utils.timeutils import utc_datetime_to_isoformat_timestr

logger = logging.getLogger(__name__)


class DTableActivitiesView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    throttle_classes = (UserRateThrottle, )

    def get(self, request):
        if not DTABLE_EVENTS_ENABLED:
            return api_error(status.HTTP_400_BAD_REQUEST, 'Events not enabled.')

        try:
            page = int(request.GET.get('page', ''))
        except ValueError:
            page = 1

        try:
            per_page = int(request.GET.get('per_page', ''))
        except ValueError:
            per_page = 25

        start = (page - 1) * per_page
        count = per_page

        username = request.user.username
        try:
            activity_list = get_user_activities(username, start, count)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        dtable_uuid_name_map = dict()
        dtable_uuid_list = list()
        for activity in activity_list:
            if activity.dtable_uuid not in dtable_uuid_name_map:
                dtable_uuid_list.append(activity.dtable_uuid)

        if dtable_uuid_list:
            dtables = DTables.objects.filter(uuid__in=dtable_uuid_list, deleted=False)
            for dtable in dtables:
                dtable_uuid_name_map[dtable.uuid.hex] = dtable.name

        activities = []
        for activity in activity_list:
            activity_dict = dict(dtable_uuid=activity.dtable_uuid)
            activity_dict['dtable_name'] = dtable_uuid_name_map[activity.dtable_uuid] if activity.dtable_uuid in dtable_uuid_name_map else ''
            activity_dict['row_id'] = activity.row_id
            activity_dict['op_type'] = activity.op_type
            activity_dict['author_email'] = activity.op_user
            activity_dict['author_name'] = email2nickname(activity.op_user)
            activity_dict['author_contact_email'] = email2contact_email(activity.op_user)
            activity_dict['op_time'] = utc_datetime_to_isoformat_timestr(activity.op_time)
            activity_dict['table_id'] = activity.table_id
            activity_dict['table_name'] = activity.table_name
            activity_dict['row_name'] = getattr(activity, "row_name", "") # compatible with previous data
            activity_dict['row_data'] = activity.row_data
            activity_dict['op_app'] = activity.op_app

            try:
                avatar_size = int(request.GET.get('avatar_size', 72))
            except ValueError:
                avatar_size = 72

            url, is_default, date_uploaded = api_avatar_url(activity.op_user, avatar_size)
            activity_dict['avatar_url'] = url

            if activity_dict['op_app']:
                activity_dict['app_avatar_url'] = api_app_avatar_url()[0]

            activities.append(activity_dict)

        return Response({'activities': activities})
