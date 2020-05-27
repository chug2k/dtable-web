# Copyright (c) 2012-2016 Seafile Ltd.
from django.conf.urls import url

from .views import thumbnail_get

urlpatterns = [
    url(r'^workspace/(?P<workspace_id>\d+)/asset/(?P<dtable_uuid>[-0-9a-f]{36})/(?P<path>.*)$', thumbnail_get, name='thumbnail_get'),
]
