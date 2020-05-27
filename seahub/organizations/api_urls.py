# Copyright (c) 2012-2016 Seafile Ltd.
from django.conf.urls import url

from seahub.api2.endpoints.org_admin.address_book.groups import (
    AdminAddressBookGroups, AdminAddressBookGroup
)

from seahub.api2.endpoints.org_admin.group_members import AdminGroupMembers, AdminGroupMember
from seahub.api2.endpoints.org_admin.users import OrgAdminUser, OrgAdminUsers
from seahub.api2.endpoints.org_admin.user_set_password import OrgAdminUserSetPassword
from seahub.api2.endpoints.org_admin.groups import OrgAdminGroups, OrgAdminGroup
from seahub.api2.endpoints.org_admin.info import OrgAdminInfo
from seahub.api2.endpoints.org_admin.dtables import OrgAdminDTablesView, OrgAdminDTableView, OrgAdminTrashDTablesView, OrgAdminTrashDTableView

urlpatterns = [
    url(r'^(?P<org_id>\d+)/admin/address-book/groups/$', AdminAddressBookGroups.as_view(), name='api-admin-address-book-groups'),
    url(r'^(?P<org_id>\d+)/admin/address-book/groups/(?P<group_id>\d+)/$', AdminAddressBookGroup.as_view(), name='api-admin-address-book-group'),

    url(r'^(?P<org_id>\d+)/admin/groups/$', OrgAdminGroups.as_view(), name='api-v2.1-org-admin-groups'),
    url(r'^(?P<org_id>\d+)/admin/groups/(?P<group_id>\d+)/$', OrgAdminGroup.as_view(), name='api-admin-group'),

    url(r'^(?P<org_id>\d+)/admin/groups/(?P<group_id>\d+)/members/$', AdminGroupMembers.as_view(), name='api-admin-group-members'),
    url(r'^(?P<org_id>\d+)/admin/groups/(?P<group_id>\d+)/members/(?P<email>[^/]+)/$', AdminGroupMember.as_view(), name='api-admin-group-member'),
    url(r'^(?P<org_id>\d+)/admin/users/$', OrgAdminUsers.as_view(), name='api-v2.1-org-admin-users'),
    url(r'^(?P<org_id>\d+)/admin/users/(?P<email>[^/]+)/$', OrgAdminUser.as_view(), name='api-v2.1-org-admin-user'),
    url(r'^(?P<org_id>\d+)/admin/users/(?P<email>[^/]+)/set-password/', OrgAdminUserSetPassword.as_view(), name='api-v2.1-org-admin-user-reset-password'),
    url(r'^(?P<org_id>\d+)/admin/dtables/$', OrgAdminDTablesView.as_view(), name='api-v2.1-org-admin-dtables'),
    url(r'^(?P<org_id>\d+)/admin/dtables/(?P<dtable_id>\d+)/$', OrgAdminDTableView.as_view(), name='api-v2.1-org-admin-dtable'),
    url(r'^(?P<org_id>\d+)/admin/trash-dtables/$', OrgAdminTrashDTablesView.as_view(), name='api-v2.1-org-admin-trash-dtables'),
    url(r'^(?P<org_id>\d+)/admin/trash-dtables/(?P<dtable_id>\d+)/$', OrgAdminTrashDTableView.as_view(), name='api-v2.1-org-admin-trash-dtable'),
    url(r'^admin/info/$', OrgAdminInfo.as_view(), name='api-v2.1-org-admin-info'),
]
