# -*- coding: utf-8 -*-
from django.conf.urls import url

from .views import dtable_file_view, dtable_asset_access, dtable_asset_preview, dtable_form_view, \
    dtable_share_link_view, dtable_row_share_link_view, dtable_form_edit, dtable_snapshot_view, dtable_form_asset, \
    dtable_plugin_asset_view, dtable_external_link_plugin_asset_view, dtable_external_link_view, dtable_external_download_link_view

urlpatterns = [
    url(r'^workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/$', dtable_file_view, name='dtable_file_view'),

    # plugin asset view and external links page's plugin asset view
    url(r'^workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/plugins/(?P<plugin_id>\d+)/(?P<path>.*)$', dtable_plugin_asset_view, name='dtable_plugins_view'),
    url(r'^dtable/external-links/(?P<token>[-0-9a-f]+)/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/plugins/(?P<plugin_id>\d+)/(?P<path>.*)$', dtable_external_link_plugin_asset_view, name='dtable_external_links_plugins_view'),

    url(r'^workspace/(?P<workspace_id>\d+)/asset/(?P<dtable_id>[-0-9a-f]{36})/(?P<path>.*)$', dtable_asset_access, name='dtable_asset_access'),
    url(r'^workspace/(?P<workspace_id>\d+)/asset-preview/(?P<dtable_id>[-0-9a-f]{36})/(?P<path>.*)$', dtable_asset_preview, name='dtable_asset_preview'),
    url(r'^dtable/forms/(?P<token>[-0-9a-f]{36})/$', dtable_form_view, name='dtable_form_view'),
    url(r'^dtable/form-edit/(?P<token>[-0-9a-f]{36})/$', dtable_form_edit, name='dtable_form_edit'),
    url(r'^dtable/forms/(?P<token>[-0-9a-f]{36})/asset/(?P<path>.*)$', dtable_form_asset, name='dtable_form_asset'),
    url(r'^dtable/links/(?P<token>[-0-9a-f]+)/$', dtable_share_link_view, name='dtable_share_link_view'),
    url(r'^dtable/row-share-links/(?P<token>[-0-9a-f]{36})/$', dtable_row_share_link_view, name='dtable_row_share_link_view'),
    url(r'^dtable/snapshots/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/(?P<commit_id>[-0-9a-f]{40})/$', dtable_snapshot_view, name='dtable_snapshot_view'),
    url(r'^dtable/external-links/(?P<token>[-0-9a-f]+)/$', dtable_external_link_view, name='dtable_external_link_view'),
    url(r'^dtable/external-links/(?P<token>[-0-9a-f]+)/download-zip/$', dtable_external_download_link_view, name='dtable_external_download_link_view'),
]
