# Copyright (c) 2012-2019 Seafile Ltd.
import logging

from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.utils.translation import ugettext as _
from seaserv import ccnet_api, seafile_api

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.dtable.models import DTables, DTableExternalLinks

logger = logging.getLogger(__name__)


class AdminExternalLinks(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsAdminUser,)

    def get(self, request):
        """ List 'all' ExternalLinks

            Permission checking:
            1. only admin can perform this action.
        """

        # list dtables by page
        try:
            current_page = int(request.GET.get('page', '1'))
            per_page = int(request.GET.get('per_page', '25'))
        except ValueError:
            current_page = 1
            per_page = 25

        start = (current_page - 1) * per_page
        end = start + per_page

        try:
            external_links_count = DTableExternalLinks.objects.count()
            external_links_queryset = DTableExternalLinks.objects.all()[start:end]
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        has_next_page = True if external_links_count > end else False
        external_link_list = [link.to_dict() for link in external_links_queryset]

        res = {
            'has_next_page': has_next_page,
            'external_link_list': external_link_list,
        }

        return Response(res)



class AdminExternalLink(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    throttle_classes = (UserRateThrottle,)
    permission_classes = (IsAdminUser,)

    def delete(self, request, token):
        """ delete a external link by token

            Permission checking:
            1. only admin can perform this action.
        """

        try:
            link = DTableExternalLinks.objects.get(token=token)
            link.delete()

        except DTableExternalLinks.DoesNotExist:
            return Response({'success': True})

        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        return Response({'success': True})