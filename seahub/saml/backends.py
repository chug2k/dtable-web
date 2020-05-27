from django.conf import settings

from seahub.auth.backends import RemoteUserBackend
from seahub.base.accounts import User
from seahub.registration.models import notify_admins_on_register_complete
from seahub.auth.utils import get_virtual_id_by_email
from seahub.utils import is_valid_email


class SAMLRemoteUserBackend(RemoteUserBackend):
    """
    This backend is to be used in conjunction with the ``RemoteUserMiddleware``
    found in the middleware module of this package, and is used when the server
    is handling authentication outside of Django.
    """

    # Create active user by default.
    activate_after_creation = getattr(settings, 'SAML_ACTIVATE_USER_AFTER_CREATION', True)


    def get_user(self, username):
        vid = get_virtual_id_by_email(username)

        try:
            user = User.objects.get(email=vid)
        except User.DoesNotExist:
            user = None
        return user

    def authenticate(self, remote_user, nickname):
        """
        The username passed as ``remote_user`` is considered trusted.  This
        method simply returns the ``User`` object with the given username

        """
        if not remote_user or not is_valid_email(remote_user):
            return

        username = self.clean_username(remote_user)
        vid = get_virtual_id_by_email(username)

        try:
            user = User.objects.get(email=vid)
        except User.DoesNotExist:
            user = User.objects.create_saml_user(
                email=username, nickname=nickname, is_active=self.activate_after_creation)
            if settings.NOTIFY_ADMIN_AFTER_REGISTRATION:
                notify_admins_on_register_complete(username)

        return user
