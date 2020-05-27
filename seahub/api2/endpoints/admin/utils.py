import time
import logging

import jwt
import requests
from django.conf import settings

from seahub.settings import DTABLE_PRIVATE_KEY, DTABLE_SERVER_URL

logger = logging.getLogger(__name__)


DTABLE_SERVER_SYS_INFO_URL = DTABLE_SERVER_URL.rstrip('/') + getattr(settings, 'DTABLE_SERVER_INFO_API', '/api/v1/admin/sys-info')


def gen_dtable_server_admin_token(username):
    payload = {
        'exp': int(time.time()) + 86400 * 3,
        'admin': username,
    }
    access_token = jwt.encode(payload, DTABLE_PRIVATE_KEY, algorithm='HS256')
    return access_token.decode()


def get_dtable_server_info(username):
    infos = {
        "web_socket_count": 0,
        "operation_count_since_up": 0,
        "loaded_dtables_count": 0,
        "last_period_operations_count": 0,
        "app_connection_count": 0
    }
    try:
        access_token = gen_dtable_server_admin_token(username)
        headers = {'Authorization': 'Token ' + access_token}
        resp = requests.get(DTABLE_SERVER_SYS_INFO_URL, headers=headers)
        if resp.status_code != 200:
            logger.error('user: %s get dtable server info resp error, code: %s', username, resp.status_code)
        else:
            infos.update(resp.json())
    except Exception as e:
        logger.error('user: %s get dtable server info error: %s', username, e)
    return infos
