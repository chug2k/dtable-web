from rest_framework import status
from django.core.cache import cache
from django.core.urlresolvers import reverse

from seahub.api2.utils import api_error
from seahub.utils import gen_token, get_site_scheme_and_netloc
from seahub.weixin.utils import weixin_check

def check_org_admin(func):
    # return decorated function if request.user is admin of the specific org,
    # raise 403 otherwise
    def _decorated(view, request, org_id, *args, **kwargs):
        org = request.user.org
        if org and org.is_staff:
            org_id = int(org_id)
            if org_id == request.user.org.org_id:
                return func(view, request, org_id, *args, **kwargs)
            else:
                return api_error(status.HTTP_403_FORBIDDEN, '')
        else:
            return api_error(status.HTTP_403_FORBIDDEN, '')

    return _decorated

def update_log_perm_audit_type(event):
    if event.to.isdigit():
        etype = event.etype.replace('-', '-group-', 1)
    elif event.to == 'all':
        etype = event.etype.replace('-', '-public-', 1)
    else:
        etype = event.etype.replace('-', '-user-', 1)

    etype = etype.replace('perm', 'permission')
    return etype

def get_or_create_invitation_link(org_id):
    """Invitation link for an org. Users will be redirected to WeChat QR page.
    """
    if not weixin_check():
        return None

    org_id = int(org_id)
    expires = 3 * 24 * 60 * 60

    def get_token_by_org_id(org_id):
        return cache.get('org_associate_%d' % org_id, None)

    def set_token_by_org_id(org_id, token):
        cache.set('org_associate_%d' % org_id, token, expires)

    def get_org_id_by_token(token):
        return cache.get('org_associate_%s' % token, -1)

    def set_org_id_by_token(token, org_id):
        cache.set('org_associate_%s' % token, org_id, expires)

    token = get_token_by_org_id(org_id)
    cached_org_id = get_org_id_by_token(token)

    if not token or org_id != cached_org_id:
        token = gen_token(32)
        set_token_by_org_id(org_id, token)
        set_org_id_by_token(token, org_id)

    link = get_site_scheme_and_netloc() + reverse('weixin_oauth_login') \
        + '?org_token=' + token
    return link
