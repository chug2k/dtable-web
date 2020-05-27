import logging
from django.db import IntegrityError
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error
from seahub.profile.models import Profile
from seahub.utils.verify import verify_sms_code

logger = logging.getLogger(__name__)


class BindPhoneView(APIView):
    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def post(self, request):
        code = request.data.get('code')
        phone = request.data.get('phone')
        if not all([code, phone]):
            error_msg = 'code or phone invalid'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        # verify code
        if not verify_sms_code(phone, 'bind_phone', code):
            error_msg = 'Code incorrect'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)
        # bind
        try:
            Profile.objects.filter(user=request.user.username).update(phone=phone)
        except IntegrityError:
            error_msg = 'The phone has been bound.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)
        except Exception as e:
            logger.error('user: %s bind phone: %s code: %s error: %s', request.user.username, phone, code, e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)
        return Response({'success': True})
