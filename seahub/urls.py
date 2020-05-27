# Copyright (c) 2012-2016 Seafile Ltd.
from django.conf import settings
from django.conf.urls import url, include
# from django.views.generic.simple import direct_to_template
from django.views.generic import TemplateView

from seahub.views import *
from seahub.views.sysadmin import *
#from seahub.views.ajax import *
from seahub.views.sso import *


from .notifications.views import notification_list

#from seahub.api2.endpoints.smart_link import SmartLink, SmartLinkToken
from seahub.api2.endpoints.groups import Groups, Group
from seahub.api2.endpoints.all_groups import AllGroups
from seahub.api2.endpoints.departments import Departments
from seahub.api2.endpoints.shareable_groups import ShareableGroups
#from seahub.api2.endpoints.group_libraries import GroupLibraries, GroupLibrary

#from seahub.api2.endpoints.group_owned_libraries import GroupOwnedLibraries, \
#        GroupOwnedLibrary, GroupOwnedLibraryUserFolderPermission, \
#        GroupOwnedLibraryGroupFolderPermission, GroupOwnedLibraryUserShare, \
#        GroupOwnedLibraryGroupShare, GroupOwnedLibraryUserShareInLibrary
from seahub.api2.endpoints.address_book.groups import AddressBookGroupsSubGroups
from seahub.api2.endpoints.address_book.members import AddressBookGroupsSearchMember

from seahub.api2.endpoints.group_members import GroupMembers, GroupMembersBulk, GroupMember
from seahub.api2.endpoints.search_group import SearchGroup
#from seahub.api2.endpoints.share_links import ShareLinks, ShareLink, \
#        ShareLinkOnlineOfficeLock, ShareLinkDirents
#from seahub.api2.endpoints.shared_folders import SharedFolders
#from seahub.api2.endpoints.shared_repos import SharedRepos, SharedRepo
#from seahub.api2.endpoints.upload_links import UploadLinks, UploadLink, \
#        UploadLinkUpload
#from seahub.api2.endpoints.repos_batch import ReposBatchView, \
#        ReposBatchCopyDirView, ReposBatchCreateDirView, \
#        ReposBatchCopyItemView, ReposBatchMoveItemView, \
#        ReposAsyncBatchCopyItemView, ReposAsyncBatchMoveItemView, \
#        ReposSyncBatchCopyItemView, ReposSyncBatchMoveItemView, \
#        ReposBatchDeleteItemView
#from seahub.api2.endpoints.repos import RepoView, ReposView
#from seahub.api2.endpoints.file import FileView
#from seahub.api2.endpoints.file_history import FileHistoryView, NewFileHistoryView
#from seahub.api2.endpoints.dir import DirView, DirDetailView
#from seahub.api2.endpoints.file_tag import FileTagView
#from seahub.api2.endpoints.file_tag import FileTagsView
#from seahub.api2.endpoints.repo_trash import RepoTrash
#from seahub.api2.endpoints.repo_commit_dir import RepoCommitDirView
#from seahub.api2.endpoints.repo_commit_revert import RepoCommitRevertView
#from seahub.api2.endpoints.deleted_repos import DeletedRepos
#from seahub.api2.endpoints.repo_history import RepoHistory
#from seahub.api2.endpoints.repo_set_password import RepoSetPassword
#from seahub.api2.endpoints.repo_send_new_password import RepoSendNewPassword
#from seahub.api2.endpoints.zip_task import ZipTaskView
#from seahub.api2.endpoints.share_link_zip_task import ShareLinkZipTaskView
#from seahub.api2.endpoints.query_zip_progress import QueryZipProgressView
#from seahub.api2.endpoints.cancel_zip_task import CancelZipTaskView
#from seahub.api2.endpoints.copy_move_task import CopyMoveTaskView
#from seahub.api2.endpoints.query_copy_move_progress import QueryCopyMoveProgressView
#from seahub.api2.endpoints.move_folder_merge import MoveFolderMergeView
from seahub.api2.endpoints.invitations import InvitationsView, InvitationsBatchView
from seahub.api2.endpoints.invitation import InvitationView, InvitationRevokeView
from seahub.api2.endpoints.notifications import NotificationsView, NotificationView
#from seahub.api2.endpoints.user_enabled_modules import UserEnabledModulesView
#from seahub.api2.endpoints.repo_file_uploaded_bytes import RepoFileUploadedBytesView
from seahub.api2.endpoints.user_avatar import UserAvatarView
#from seahub.api2.endpoints.wikis import WikisView, WikiView
#from seahub.api2.endpoints.drafts import DraftsView, DraftView
#from seahub.api2.endpoints.draft_reviewer import DraftReviewerView
#from seahub.api2.endpoints.repo_draft_info import RepoDraftInfo, RepoDraftCounts
#from seahub.api2.endpoints.activities import ActivitiesView
#from seahub.api2.endpoints.wiki_pages import WikiPageView, WikiPagesView, WikiPagesDirView, WikiPageContentView
#from seahub.api2.endpoints.revision_tag import TaggedItemsView, TagNamesView
from seahub.api2.endpoints.user import User
from seahub.api2.endpoints.user_list import UserListView
from seahub.api2.endpoints.profile import BindPhoneView
from seahub.api2.endpoints.verify import SmsVerifyCodeView
#from seahub.api2.endpoints.repo_tags import RepoTagsView, RepoTagView
#from seahub.api2.endpoints.file_tag import RepoFileTagsView, RepoFileTagView
#from seahub.api2.endpoints.tag_filter_file import TaggedFilesView
#from seahub.api2.endpoints.related_files import RelatedFilesView, RelatedFileView
#from seahub.api2.endpoints.webdav_secret import WebdavSecretView
#from seahub.api2.endpoints.starred_items import StarredItems
#from seahub.api2.endpoints.markdown_lint import MarkdownLintView
#from seahub.api2.endpoints.public_repos_search import PublishedRepoSearchView
from seahub.api2.endpoints.dtable import WorkspacesView, DTableView, DTablesView, \
    DTableAssetUploadLinkView, DTableAccessTokenView, DTableUpdateLinkView, \
    DTableDownloadLinkView, DTableRowSharesView, DTableRowShareView, InternalDTableRelatedUsersView, \
    DTableImageRotateView
from seahub.api2.endpoints.dtable_api_token import DTableAPITokensView, DTableAPITokenView, \
    DTableAppAccessTokenView, DTableAppUploadLinkView, DTableAppDownloadLinkView, DTableAPITokenStatusView
from seahub.api2.endpoints.dtable_forms import DTableFormsView, DTableFormView, DTableFormSubmitView, \
    DTableFormUploadLinkView, DTableFormShareView, SharedFormsView
from seahub.api2.endpoints.dtable_share import SharedDTablesView, DTableShareView, \
    DTableGroupSharesView, DTableGroupShareView, GroupSharedDTablesView
from seahub.api2.endpoints.dtable_related_users import DTableRelatedUsersView
from seahub.api2.endpoints.dtable_share_links import DTableShareLinksView, DTableSharedLinkView, DTableShareLinkAccessTokenView
from seahub.api2.endpoints.dtable_excel import DTableExportExcel
from seahub.api2.endpoints.dtable_io import DTableIOStatus, DTableExportContent, DTableImportDTable, DTableExportDTable
from seahub.api2.endpoints.dtable_common_dataset import DTableCommonDatasetsView, DTableCommonDatasetView
from seahub.api2.endpoints.dtable_common_dataset_access_group import DTableCommonDatasetAccessGroupsView, DTableCommonDatasetAccessGroupView
from seahub.api2.endpoints.seafile_connectors import SeafileConnectorsView, SeafileConnectorView
from seahub.api2.endpoints.dtable_activities import DTableActivitiesView
from seahub.api2.endpoints.dtable_snapshot import DTableSnapshotsView, DTableSnapshotView, DTableLatestCommitIdView
from seahub.api2.endpoints.dtable_plugins import DTablePluginsView, DTablePluginView
from seahub.api2.endpoints.dtable_external_links import DTableExternalLinksView, DTableExternalLinkView, \
    DTableExternalLinkAccessTokenView, DTableExternalLinkPluginsView
from seahub.api2.endpoints.dtable_copy import DTableCopyView, DTableExternalLinkCopyView
from seahub.api2.endpoints.dtable_storage import DTableStorageView, DTableAssetExistsView
from seahub.api2.endpoints.user_starred_dtables import UserStarredDTablesView

# Admin
#from seahub.api2.endpoints.admin.revision_tag import AdminTaggedItemsView
from seahub.api2.endpoints.admin.login_logs import LoginLogs, AdminLoginLogs
#from seahub.api2.endpoints.admin.file_audit import FileAudit
#from seahub.api2.endpoints.admin.file_update import FileUpdate
#from seahub.api2.endpoints.admin.perm_audit import PermAudit
from seahub.api2.endpoints.admin.sysinfo import SysInfo
from seahub.api2.endpoints.admin.web_settings import AdminWebSettings
#from seahub.api2.endpoints.admin.statistics import (
#    FileOperationsView, TotalStorageView, ActiveUsersView, SystemTrafficView, \
#    SystemUserTrafficExcelView, SystemUserStorageExcelView
#)
#from seahub.api2.endpoints.admin.devices import AdminDevices
#from seahub.api2.endpoints.admin.device_errors import AdminDeviceErrors
from seahub.api2.endpoints.admin.users import AdminUsers, AdminUser, AdminUserResetPassword, \
    AdminUserGroups, AdminAdminUsers, AdminSearchUser
from seahub.api2.endpoints.admin.libraries import AdminLibraries, AdminLibrary
from seahub.api2.endpoints.admin.library_dirents import AdminLibraryDirents, AdminLibraryDirent
from seahub.api2.endpoints.admin.system_library import AdminSystemLibrary, \
        AdminSystemLibraryUploadLink
from seahub.api2.endpoints.admin.trash_libraries import AdminTrashLibraries, AdminTrashLibrary
from seahub.api2.endpoints.admin.groups import AdminGroups, AdminGroup, AdminSearchGroup
from seahub.api2.endpoints.admin.group_members import AdminGroupMembers, AdminGroupMember
from seahub.api2.endpoints.admin.group_storages import AdminGroupStorages
#from seahub.api2.endpoints.admin.share_links import AdminShareLink, \
#        AdminShareLinkDownload, AdminShareLinkCheckPassword, \
#        AdminShareLinkDirents
#from seahub.api2.endpoints.admin.upload_links import AdminUploadLink, \
#        AdminUploadLinkUpload, AdminUploadLinkCheckPassword
from seahub.api2.endpoints.admin.users_batch import AdminUsersBatch, AdminAdminUsersBatch, \
        AdminImportUsers
from seahub.api2.endpoints.admin.operation_logs import AdminOperationLogs
from seahub.api2.endpoints.admin.organizations import AdminOrganizations, AdminOrganization, AdminSearchOrganization
from seahub.api2.endpoints.admin.org_users import AdminOrgUsers, AdminOrgUser
from seahub.api2.endpoints.admin.org_groups import AdminOrgGroups
from seahub.api2.endpoints.admin.logo import AdminLogo
from seahub.api2.endpoints.admin.favicon import AdminFavicon
from seahub.api2.endpoints.admin.license import AdminLicense
from seahub.api2.endpoints.admin.invitations import InvitationsView as AdminInvitationsView
#from seahub.api2.endpoints.admin.library_history import AdminLibraryHistoryLimit
from seahub.api2.endpoints.admin.login_bg_image import AdminLoginBgImage
from seahub.api2.endpoints.admin.admin_role import AdminAdminRole
from seahub.api2.endpoints.admin.address_book.groups import AdminAddressBookGroups, \
        AdminAddressBookGroup
#from seahub.api2.endpoints.admin.group_owned_libraries import AdminGroupOwnedLibraries, \
#        AdminGroupOwnedLibrary
#from seahub.api2.endpoints.admin.user_activities import UserActivitiesView
#from seahub.api2.endpoints.admin.file_scan_records import AdminFileScanRecords
from seahub.api2.endpoints.admin.notifications import AdminNotificationsView
from seahub.api2.endpoints.admin.work_weixin import AdminWorkWeixinDepartments, \
    AdminWorkWeixinDepartmentMembers, AdminWorkWeixinUsersBatch, AdminWorkWeixinDepartmentsImport
#from seahub.api2.endpoints.file_participants import FileParticipantsView, FileParticipantView
#from seahub.api2.endpoints.repo_related_users import RepoRelatedUsersView
from seahub.api2.endpoints.admin.dtables import AdminDtables, AdminTrashDTablesView, AdminTrashDTableView
from seahub.api2.endpoints.admin.group_dtables import AdminGroupDTables, AdminGroupDTable
from seahub.api2.endpoints.admin.sys_notifications import AdminSysNotificationsView, AdminSysNotificationView
from seahub.api2.endpoints.admin.statistics import ActiveUsersView
from seahub.api2.endpoints.admin.external_links import AdminExternalLinks, AdminExternalLink

urlpatterns = [
    url(r'^accounts/', include('seahub.registration.urls')),

    url(r'^sso/$', sso, name='sso'),
    url(r'^shib-login/', shib_login, name="shib_login"),
    url(r'^oauth/', include('seahub.oauth.urls')),

    url(r'^$', dtable_fake_view, name='dtable'),
    #url(r'^$', libraries, name='libraries'),
    #url(r'^home/$', direct_to_template, { 'template': 'home.html' } ),
    url(r'^robots\.txt$', TemplateView.as_view(template_name='robots.txt', content_type='text/plain')),

    ### lib (replace the old `repo` urls) ###
    # url(r'^lib/(?P<repo_id>[-0-9a-f]{36})/dir/(?P<path>.*)$', view_lib_dir, name='view_lib_dir'),

    ### Misc ###
    url(r'^image-view/(?P<filename>.*)$', image_view, name='image_view'),
    url(r'^custom-css/$', custom_css_view, name='custom_css'),
    url(r'^i18n/$', i18n, name='i18n'),
    url(r'^choose_register/$', choose_register, name="choose_register"),

    ### React ###
    #url(r'^org/$', react_fake_view, name="org"),
    #url(r'^invitations/$', react_fake_view, name="invitations"),
    url(r'^dtable/$', dtable_fake_view, name='dtable'),
    url(r'^forms/$', dtable_fake_view, name='forms'),
    url(r'^activities/$', dtable_fake_view, name='dtable_activities'),
    url(r'^common-datasets/$', dtable_fake_view, name='dtable_common_datasets'),
    url(r'^dtable/apps/$', dtable_fake_view, name='dtable_apps'),
    url(r'^dtable/templetes/$', dtable_fake_view, name='dtable_templetes'),


    ### Apps ###
    url(r'^api2/', include('seahub.api2.urls')),

    ## user
    url(r'^api/v2.1/user/$', User.as_view(), name="api-v2.1-user"),

    ## user:phone
    url(r'^api/v2.1/user/sms-verify/$', SmsVerifyCodeView.as_view(), name="api-v2.1-user-sms-verify"),
    url(r'^api/v2.1/user/bind-phone/$', BindPhoneView.as_view(), name="api-v2.1-user-phone-bind"),

    ## user::smart-link
    #url(r'^api/v2.1/smart-link/$', SmartLink.as_view(), name="api-v2.1-smart-link"),
    #url(r'^api/v2.1/smart-links/(?P<token>[-0-9a-f]{36})/$', SmartLinkToken.as_view(), name="api-v2.1-smart-links-token"),

    # departments
    url(r'api/v2.1/departments/$', Departments.as_view(), name='api-v2.1-all-departments'),

    ## user::groups
    url(r'^api/v2.1/all-groups/$', AllGroups.as_view(), name='api-v2.1-all-groups'),
    url(r'^api/v2.1/shareable-groups/$', ShareableGroups.as_view(), name='api-v2.1-shareable-groups'),
    url(r'^api/v2.1/groups/$', Groups.as_view(), name='api-v2.1-groups'),
    url(r'^api/v2.1/groups/(?P<group_id>\d+)/$', Group.as_view(), name='api-v2.1-group'),
    #url(r'^api/v2.1/groups/(?P<group_id>\d+)/libraries/$', GroupLibraries.as_view(), name='api-v2.1-group-libraries'),
    #url(r'^api/v2.1/groups/(?P<group_id>\d+)/libraries/(?P<repo_id>[-0-9a-f]{36})/$', GroupLibrary.as_view(), name='api-v2.1-group-library'),
    #url(r'^api/v2.1/groups/(?P<group_id>\d+)/group-owned-libraries/$', GroupOwnedLibraries.as_view(), name='api-v2.1-group-owned-libraries'),
    #url(r'^api/v2.1/groups/(?P<group_id>\d+)/group-owned-libraries/(?P<repo_id>[-0-9a-f]{36})/$', GroupOwnedLibrary.as_view(), name='api-v2.1-owned-group-library'),
    url(r'^api/v2.1/groups/(?P<group_id>\d+)/members/$', GroupMembers.as_view(), name='api-v2.1-group-members'),
    url(r'^api/v2.1/groups/(?P<group_id>\d+)/members/bulk/$', GroupMembersBulk.as_view(), name='api-v2.1-group-members-bulk'),
    url(r'^api/v2.1/groups/(?P<group_id>\d+)/members/(?P<email>[^/]+)/$', GroupMember.as_view(), name='api-v2.1-group-member'),
    url(r'^api/v2.1/search-group/$', SearchGroup.as_view(), name='api-v2.1-search-group'),

    ## address book
    url(r'^api/v2.1/address-book/groups/(?P<group_id>\d+)/sub-groups/$', AddressBookGroupsSubGroups.as_view(), name='api-v2.1-address-book-groups-sub-groups'),
    url(r'^api/v2.1/address-book/groups/(?P<group_id>\d+)/search-member/$', AddressBookGroupsSearchMember.as_view(), name='api-v2.1-address-book-search-member'),
    #url(r'^api/v2.1/group-owned-libraries/(?P<repo_id>[-0-9a-f]{36})/user-folder-permission/$', GroupOwnedLibraryUserFolderPermission.as_view(), name='api-v2.1-group-owned-library-user-folder-permission'),
    #rl(r'^api/v2.1/group-owned-libraries/(?P<repo_id>[-0-9a-f]{36})/group-folder-permission/$', GroupOwnedLibraryGroupFolderPermission.as_view(), name='api-v2.1-group-owned-library-group-folder-permission'),
    #url(r'^api/v2.1/group-owned-libraries/(?P<repo_id>[-0-9a-f]{36})/user-share/$', GroupOwnedLibraryUserShare.as_view(), name='api-v2.1-group-owned-library-user-share'),
    #url(r'^api/v2.1/group-owned-libraries/(?P<repo_id>[-0-9a-f]{36})/group-share/$', GroupOwnedLibraryGroupShare.as_view(), name='api-v2.1-group-owned-library-group-share'),
    #url(r'^api/v2.1/group-owned-libraries/user-share-in-libraries/(?P<repo_id>[-0-9-a-f]{36})/$', GroupOwnedLibraryUserShareInLibrary.as_view(), name='api-v2.1-group-owned-library-user-share-in-library'),

    ## user::shared-folders
    #url(r'^api/v2.1/shared-folders/$', SharedFolders.as_view(), name='api-v2.1-shared-folders'),

    ## user::shared-repos
    #url(r'^api/v2.1/shared-repos/$', SharedRepos.as_view(), name='api-v2.1-shared-repos'),
    #url(r'^api/v2.1/shared-repos/(?P<repo_id>[-0-9a-f]{36})/$', SharedRepo.as_view(), name='api-v2.1-shared-repo'),

    ## user::shared-download-links
    #url(r'^api/v2.1/share-links/$', ShareLinks.as_view(), name='api-v2.1-share-links'),
    #url(r'^api/v2.1/share-links/(?P<token>[a-f0-9]+)/$', ShareLink.as_view(), name='api-v2.1-share-link'),
    #url(r'^api/v2.1/share-links/(?P<token>[a-f0-9]+)/dirents/$', ShareLinkDirents.as_view(), name='api-v2.1-share-link-dirents'),
    #url(r'^api/v2.1/share-links/(?P<token>[a-f0-9]+)/online-office-lock/$',
    #        ShareLinkOnlineOfficeLock.as_view(), name='api-v2.1-share-link-online-office-lock'),

    ## user::shared-upload-links
    #url(r'^api/v2.1/upload-links/$', UploadLinks.as_view(), name='api-v2.1-upload-links'),
    #url(r'^api/v2.1/upload-links/(?P<token>[a-f0-9]+)/$', UploadLink.as_view(), name='api-v2.1-upload-link'),
    #url(r'^api/v2.1/upload-links/(?P<token>[a-f0-9]+)/upload/$', UploadLinkUpload.as_view(), name='api-v2.1-upload-link-upload'),

    ## user::revision-tags
    #url(r'^api/v2.1/revision-tags/tagged-items/$', TaggedItemsView.as_view(), name='api-v2.1-revision-tags-tagged-items'),
    #url(r'^api/v2.1/revision-tags/tag-names/$', TagNamesView.as_view(), name='api-v2.1-revision-tags-tag-names'),

    ## user::repos-batch-operate
    # for icourt
    #url(r'^api/v2.1/repos/batch/$', ReposBatchView.as_view(), name='api-v2.1-repos-batch'),
    #url(r'^api/v2.1/repos/batch-copy-dir/$', ReposBatchCopyDirView.as_view(), name='api-v2.1-repos-batch-copy-dir'),
    #url(r'^api/v2.1/repos/batch-create-dir/$', ReposBatchCreateDirView.as_view(), name='api-v2.1-repos-batch-create-dir'),
    #url(r'^api/v2.1/repos/batch-copy-item/$', ReposBatchCopyItemView.as_view(), name='api-v2.1-repos-batch-copy-item'),
    #url(r'^api/v2.1/repos/batch-move-item/$', ReposBatchMoveItemView.as_view(), name='api-v2.1-repos-batch-move-item'),

    #url(r'^api/v2.1/repos/batch-delete-item/$', ReposBatchDeleteItemView.as_view(), name='api-v2.1-repos-batch-delete-item'),
    #url(r'^api/v2.1/repos/async-batch-copy-item/$', ReposAsyncBatchCopyItemView.as_view(), name='api-v2.1-repos-async-batch-copy-item'),
    #url(r'^api/v2.1/repos/async-batch-move-item/$', ReposAsyncBatchMoveItemView.as_view(), name='api-v2.1-repos-async-batch-move-item'),
    #url(r'^api/v2.1/repos/sync-batch-copy-item/$', ReposSyncBatchCopyItemView.as_view(), name='api-v2.1-repos-sync-batch-copy-item'),
    #url(r'^api/v2.1/repos/sync-batch-move-item/$', ReposSyncBatchMoveItemView.as_view(), name='api-v2.1-repos-sync-batch-move-item'),

    ## user::deleted repos
    #url(r'^api/v2.1/deleted-repos/$', DeletedRepos.as_view(), name='api2-v2.1-deleted-repos'),

    ## user::repos
    #url(r'^api/v2.1/repos/$', ReposView.as_view(), name='api-v2.1-repos-view'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/$', RepoView.as_view(), name='api-v2.1-repo-view'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/file/$', FileView.as_view(), name='api-v2.1-file-view'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/file/history/$', FileHistoryView.as_view(), name='api-v2.1-file-history-view'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/file/new_history/$', NewFileHistoryView.as_view(), name='api-v2.1-new-file-history-view'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/dir/$', DirView.as_view(), name='api-v2.1-dir-view'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/commits/(?P<commit_id>[0-9a-f]{40})/dir/$', RepoCommitDirView.as_view(), name='api-v2.1-repo-commit-dir'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/commits/(?P<commit_id>[0-9a-f]{40})/revert/$', RepoCommitRevertView.as_view(), name='api-v2.1-repo-commit-revert'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/dir/detail/$', DirDetailView.as_view(), name='api-v2.1-dir-detail-view'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/trash/$', RepoTrash.as_view(), name='api-v2.1-repo-trash'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/history/$', RepoHistory.as_view(), name='api-v2.1-repo-history'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/set-password/$', RepoSetPassword.as_view(), name="api-v2.1-repo-set-password"),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/send-new-password/$', RepoSendNewPassword.as_view(), name="api-v2.1-repo-send-new-password"),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/repo-tags/$', RepoTagsView.as_view(), name='api-v2.1-repo-tags'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/repo-tags/(?P<repo_tag_id>\d+)/$', RepoTagView.as_view(), name='api-v2.1-repo-tag'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/file-tags/$', RepoFileTagsView.as_view(), name='api-v2.1-file-tags'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/file-tags/(?P<file_tag_id>\d+)/$', RepoFileTagView.as_view(), name='api-v2.1-file-tag'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/tagged-files/(?P<repo_tag_id>\d+)/$', TaggedFilesView.as_view(), name='api-v2.1-tagged-files'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/file/participants/$', FileParticipantsView.as_view(), name='api-v2.1-file-participants'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/file/participant/$', FileParticipantView.as_view(), name='api-v2.1-file-participant'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/related-users/$', RepoRelatedUsersView.as_view(), name='api-v2.1-related-user'),

    # user::related-files
    #url(r'^api/v2.1/related-files/$', RelatedFilesView.as_view(), name='api-v2.1-related-files'),
    #url(r'^api/v2.1/related-files/(?P<related_id>\d+)/$', RelatedFileView.as_view(), name='api-v2.1-related-file'),

    # user: markdown-lint
    #url(r'^api/v2.1/markdown-lint/$', MarkdownLintView.as_view(), name='api-v2.1-markdown-lint'),

    # public repos search
    #url(r'^api/v2.1/published-repo-search/$', PublishedRepoSearchView.as_view(), name='api-v2.1-published-repo-search'),

    # user: dtable
    url(r'^api/v2.1/workspaces/$', WorkspacesView.as_view(), name='api-v2.1-workspaces'),
    url(r'^api/v2.1/dtables/$', DTablesView.as_view(), name='api-v2.1-dtables'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/$', DTableView.as_view(), name='api-v2.1-workspace-dtable'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable-asset-upload-link/$', DTableAssetUploadLinkView.as_view(), name='api-v2.1-workspace-dtable-asset-upload-link'),

    url(r'^api/v2.1/dtables/shared/$', SharedDTablesView.as_view(), name='api-v2.1-dtables-share'),
    url(r'^api/v2.1/dtables/group-shared/$', GroupSharedDTablesView.as_view(), name='api-v2.1-group-dtables-share'),
    url(r'^api/v2.1/dtables/share-links/$', DTableShareLinksView.as_view(), name='api-v2.1-dtables-share-links'),
    url(r'^api/v2.1/dtables/share-links/(?P<token>[0-9a-f]+)/$', DTableSharedLinkView.as_view(), name='api-v2.1-dtables-share-link'),

    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/share/$', DTableShareView.as_view(), name='api-v2.1-dtable-share'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/group-shares/$', DTableGroupSharesView.as_view(), name='api-v2.1-dtable-group-shares'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/group-shares/(?P<group_id>\d+)/$', DTableGroupShareView.as_view(), name='api-v2.1-dtable-group-share'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/related-users/$', DTableRelatedUsersView.as_view(), name='api-v2.1-dtable-related-users'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/access-token/$', DTableAccessTokenView.as_view(), name='api-v2.1-dtable-access-token'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/api-tokens/$', DTableAPITokensView.as_view(), name='api-v2.1-dtable-api-tokens'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/api-tokens/(?P<app_name>.*)/$', DTableAPITokenView.as_view(), name='api-v2.1-dtable-api-token'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/api-tokens-status/$', DTableAPITokenStatusView.as_view(), name='api-v2.1-dtable-api-token-status'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/export-excel/$', DTableExportExcel.as_view(), name='api-v2.1-dtable-export-excel'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/snapshots/$', DTableSnapshotsView.as_view(), name='api-v2.1-dtable-snapshots'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/snapshots/(?P<commit_id>[-0-9a-f]{40})/$', DTableSnapshotView.as_view(), name='api-v2.1-dtable-snapshot'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/plugins/$', DTablePluginsView.as_view(), name='api-v2.1-dtable-plugins'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/plugins/(?P<plugin_id>\d+)/$', DTablePluginView.as_view(), name='api-v2.1-dtable-plugin'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/rotate-image/$', DTableImageRotateView.as_view(), name='api-v2.1-dtable-picture-rotate'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/asset-exists/$', DTableAssetExistsView.as_view(), name='api-v2.1-dtable-asset-exists'),
    url(r'^api/v2.1/starred-dtables/', UserStarredDTablesView.as_view(), name='api-v2.1-starred-dtables'),


    # dtable external link
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/external-links/$', DTableExternalLinksView.as_view(), name='api-v2.1-dtable-external-link-tokens'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/external-links/(?P<token>.*)/$', DTableExternalLinkView.as_view(), name='api-v2.1-dtable-external-link-token'),
    url(r'^api/v2.1/external-link-tokens/(?P<token>.*)/access-token/$', DTableExternalLinkAccessTokenView.as_view(), name='api-v2.1-dtable-external-link-token-access-token'),
    url(r'^api/v2.1/external-link-tokens/(?P<token>.*)/plugins/$', DTableExternalLinkPluginsView.as_view(), name='api-v2.1-dtable-external-link-plugins'),

    url(r'^api/v2.1/dtable/share-link-access-token/$', DTableShareLinkAccessTokenView.as_view(), name='api-v2.1-dtable-share-link-access-token'),
    url(r'^api/v2.1/dtable/app-access-token/$', DTableAppAccessTokenView.as_view(), name='api-v2.1-dtable-app-access-token'),
    url(r'^api/v2.1/dtable/app-upload-link/$', DTableAppUploadLinkView.as_view(), name='api-v2.1-dtable-app-upload-link'),
    url(r'^api/v2.1/dtable/app-download-link/$', DTableAppDownloadLinkView.as_view(), name='api-v2.1-dtable-app-download-link'),

    url(r'^api/v2.1/forms/$', DTableFormsView.as_view(), name='api-v2.1-dtable-forms'),
    url(r'^api/v2.1/forms/shared/$', SharedFormsView.as_view(), name='api-v2.1-forms-shared'),
    url(r'^api/v2.1/forms/(?P<token>[-0-9a-f]{36})/$', DTableFormView.as_view(), name='api-v2.1-dtable-form'),
    url(r'^api/v2.1/form-submit/(?P<token>[-0-9a-f]{36})/$', DTableFormSubmitView.as_view(), name='api-v2.1-dtable-form-submit'),
    url(r'^api/v2.1/forms/(?P<token>[-0-9a-f]{36})/upload-link/$', DTableFormUploadLinkView.as_view(), name='api-v2.1-dtable-form-upload-link'),
    url(r'^api/v2.1/forms/(?P<token>[-0-9a-f]{36})/share/$', DTableFormShareView.as_view(), name='api-v2.1-dtable-form-share'),

    url(r'^api/v2.1/dtable-row-shares/$', DTableRowSharesView.as_view(), name='api-v2.1-dtable-row-shares'),
    url(r'^api/v2.1/dtable-row-shares/(?P<token>[-0-9a-f]{36})/$', DTableRowShareView.as_view(), name='api-v2.1-dtable-row-share'),

    url(r'^api/v2.1/dtable-internal/get-file-update-link/$', DTableUpdateLinkView.as_view(), name='api-v2.1-dtable-update-link'),
    url(r'^api/v2.1/dtable-internal/get-file-download-link/$', DTableDownloadLinkView.as_view(), name='api-v2.1-dtable-download-link'),
    url(r'^api/v2.1/dtable-internal/get-latest-commit-id/$', DTableLatestCommitIdView.as_view(), name='api-v2.1-dtable-latest-commit-id'),
    url(r'^api/v2.1/dtable-internal/get-related-users/$', InternalDTableRelatedUsersView.as_view(), name='api-v2.1-internal-dtable-related-users'),
    url(r'^api/v2.1/dtable-copy/$', DTableCopyView.as_view(), name='api-v2.1-dtable-copy'),
    url(r'^api/v2.1/dtable-external-link/dtable-copy/$', DTableExternalLinkCopyView.as_view(), name='api-v2.1-dtable-external-link-copy'),

    url(r'^api/v2.1/dtable-asset/(?P<dtable_uuid>[-0-9a-f]{36})/$', DTableStorageView.as_view(), name='api-v2.1-dtable-storage'),

    # dtable global db
    url(r'^api/v2.1/dtable/common-datasets/$', DTableCommonDatasetsView.as_view(), name='api-v2.1-dtable-common-datasets'),
    url(r'^api/v2.1/dtable/common-datasets/(?P<dataset_id>\d+)/$', DTableCommonDatasetView.as_view(), name='api-v2.1-dtable-common-dataset'),
    url(r'^api/v2.1/dtable/common-datasets/(?P<dataset_id>\d+)/access-groups/$', DTableCommonDatasetAccessGroupsView.as_view(), name='api-v2.1-dtable-common-dataset-access-groups'),
    url(r'^api/v2.1/dtable/common-datasets/(?P<dataset_id>\d+)/access-groups/(?P<group_id>\d+)/$', DTableCommonDatasetAccessGroupView.as_view(), name='api-v2.1-dtable-common-dataset-access-group'),

    # dtable-seafile
    url(r'^api/v2.1/seafile-connectors/$', SeafileConnectorsView.as_view(), name='api-v2.1-seafile-connectors'),
    url(r'^api/v2.1/seafile-connectors/(?P<connector_id>[0-9]+)/$', SeafileConnectorView.as_view(), name='api-v2.1-seafile-connector'),

    # dtable activities
    url(r'^api/v2.1/dtable-activities/$', DTableActivitiesView.as_view(), name='api-v2.1-dtable-activities'),

    # dtable import export
    url(r'^api/v2.1/dtable-io-status/$', DTableIOStatus.as_view(), name='api-v2.1-dtable-io-status'),
    url(r'^api/v2.1/dtable-export-content/$', DTableExportContent.as_view(), name='api-v2.1-dtable-export-content'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/import-dtable/$', DTableImportDTable.as_view(),  name='api-v2.1-dtable-import-dtable'),
    url(r'^api/v2.1/workspace/(?P<workspace_id>\d+)/dtable/(?P<name>.*)/export-dtable/$', DTableExportDTable.as_view(), name='api-v2.1-dtable-export-dtable'),

    # user list
    url(r'^api/v2.1/user-list/$', UserListView.as_view(), name='api-v2.1-user-list'),

    # Deprecated
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/tags/$', FileTagsView.as_view(), name="api-v2.1-filetags-view"),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/tags/(?P<name>.*?)/$', FileTagView.as_view(), name="api-v2.1-filetag-view"),

    ## user::download-dir-zip-task
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/zip-task/$', ZipTaskView.as_view(), name='api-v2.1-zip-task'),
    #url(r'^api/v2.1/repos/(?P<repo_id>[-0-9a-f]{36})/file-uploaded-bytes/$', RepoFileUploadedBytesView.as_view(), name='api-v2.1-repo-file-uploaded-bytes'),
    #url(r'^api/v2.1/share-link-zip-task/$', ShareLinkZipTaskView.as_view(), name='api-v2.1-share-link-zip-task'),
    #url(r'^api/v2.1/query-zip-progress/$', QueryZipProgressView.as_view(), name='api-v2.1-query-zip-progress'),
    #url(r'^api/v2.1/cancel-zip-task/$', CancelZipTaskView.as_view(), name='api-v2.1-cancel-zip-task'),
    #url(r'^api/v2.1/copy-move-task/$', CopyMoveTaskView.as_view(), name='api-v2.1-copy-move-task'),
    #url(r'^api/v2.1/query-copy-move-progress/$', QueryCopyMoveProgressView.as_view(), name='api-v2.1-query-copy-move-progress'),

    #url(r'^api/v2.1/move-folder-merge/$', MoveFolderMergeView.as_view(), name='api-v2.1-move-folder-merge'),

    url(r'^api/v2.1/notifications/$', NotificationsView.as_view(), name='api-v2.1-notifications'),
    url(r'^api/v2.1/notification/$', NotificationView.as_view(), name='api-v2.1-notification'),
    #url(r'^api/v2.1/user-enabled-modules/$', UserEnabledModulesView.as_view(), name='api-v2.1-user-enabled-module'),

    ## user::invitations
    url(r'^api/v2.1/invitations/$', InvitationsView.as_view()),
    url(r'^api/v2.1/invitations/batch/$', InvitationsBatchView.as_view()),
    url(r'^api/v2.1/invitations/(?P<token>[a-f0-9]{32})/$', InvitationView.as_view()),
    url(r'^api/v2.1/invitations/(?P<token>[a-f0-9]{32})/revoke/$', InvitationRevokeView.as_view()),

    ## user::avatar
    url(r'^api/v2.1/user-avatar/$', UserAvatarView.as_view(), name='api-v2.1-user-avatar'),

    ## user::starred-item
    #url(r'^api/v2.1/starred-items/$', StarredItems.as_view(), name='api-v2.1-starred-items'),

    ## user::activities
    #url(r'^api/v2.1/activities/$', ActivitiesView.as_view(), name='api-v2.1-acitvity'),

    # admin: activities
    #url(r'^api/v2.1/admin/user-activities/$', UserActivitiesView.as_view(), name='api-v2.1-admin-user-activity'),

    ## admin::sysinfo
    url(r'^api/v2.1/admin/sysinfo/$', SysInfo.as_view(), name='api-v2.1-sysinfo'),

    ## admin:web settings
    url(r'^api/v2.1/admin/web-settings/$', AdminWebSettings.as_view(), name='api-v2.1-web-settings'),

    ## admin::revision-tags
    #url(r'^api/v2.1/admin/revision-tags/tagged-items/$', AdminTaggedItemsView.as_view(), name='api-v2.1-admin-revision-tags-tagged-items'),

    ## admin::statistics
    #url(r'^api/v2.1/admin/statistics/file-operations/$', FileOperationsView.as_view(), name='api-v2.1-admin-statistics-file-operations'),
    #url(r'^api/v2.1/admin/statistics/total-storage/$', TotalStorageView.as_view(), name='api-v2.1-admin-statistics-total-storage'),
    #url(r'^api/v2.1/admin/statistics/active-users/$', ActiveUsersView.as_view(), name='api-v2.1-admin-statistics-active-users'),
    #url(r'^api/v2.1/admin/statistics/system-traffic/$', SystemTrafficView.as_view(), name='api-v2.1-admin-statistics-system-traffic'),
    #url(r'^api/v2.1/admin/statistics/system-user-traffic/excel/$', SystemUserTrafficExcelView.as_view(), name='api-v2.1-admin-statistics-system-user-traffic-excel'),
    #url(r'^api/v2.1/admin/statistics/system-user-storage/excel/$', SystemUserStorageExcelView.as_view(), name='api-v2.1-admin-statistics-system-user-storage-excel'),

    ## admin::users
    url(r'^api/v2.1/admin/users/$', AdminUsers.as_view(), name='api-v2.1-admin-users'),
    url(r'^api/v2.1/admin/users/batch/$', AdminUsersBatch.as_view(), name='api-v2.1-admin-users-batch'),
    url(r'^api/v2.1/admin/search-user/$', AdminSearchUser.as_view(), name='api-v2.1-admin-search-user'),

    ## admin::admin-role
    url(r'^api/v2.1/admin/admin-role/$', AdminAdminRole.as_view(), name='api-v2.1-admin-admin-role'),
    url(r'^api/v2.1/admin/import-users/$', AdminImportUsers.as_view(), name='api-v2.1-admin-import-users'),

    # [^...] Matches any single character not in brackets
    # + Matches between one and unlimited times, as many times as possible
    url(r'^api/v2.1/admin/users/(?P<email>[^/]+@[^/]+)/$', AdminUser.as_view(), name='api-v2.1-admin-user'),
    url(r'^api/v2.1/admin/users/(?P<email>[^/]+@[^/]+)/reset-password/$', AdminUserResetPassword.as_view(), name='api-v2.1-admin-user-reset-password'),
    url(r'^api/v2.1/admin/users/(?P<email>[^/]+@[^/]+)/groups/$', AdminUserGroups.as_view(), name='api-v2.1-admin-user-groups'),

    url(r'^api/v2.1/admin/admin-users/$', AdminAdminUsers.as_view(), name='api-v2.1-admin-admin-users'),
    url(r'^api/v2.1/admin/admin-users/batch/$', AdminAdminUsersBatch.as_view(), name='api-v2.1-admin-users-batch'),

    ## admin::devices

    #url(r'^api/v2.1/admin/devices/$', AdminDevices.as_view(), name='api-v2.1-admin-devices'),
    #url(r'^api/v2.1/admin/device-errors/$', AdminDeviceErrors.as_view(), name='api-v2.1-admin-device-errors'),

    ## admin::libraries
    #url(r'^api/v2.1/admin/libraries/$', AdminLibraries.as_view(), name='api-v2.1-admin-libraries'),
    #url(r'^api/v2.1/admin/libraries/(?P<repo_id>[-0-9a-f]{36})/$', AdminLibrary.as_view(), name='api-v2.1-admin-library'),
    #url(r'^api/v2.1/admin/libraries/(?P<repo_id>[-0-9a-f]{36})/history-limit/$', AdminLibraryHistoryLimit.as_view(), name="api-v2.1-admin-library-history-limit"),
    #url(r'^api/v2.1/admin/libraries/(?P<repo_id>[-0-9a-f]{36})/dirents/$', AdminLibraryDirents.as_view(), name='api-v2.1-admin-library-dirents'),
    #url(r'^api/v2.1/admin/libraries/(?P<repo_id>[-0-9a-f]{36})/dirent/$', AdminLibraryDirent.as_view(), name='api-v2.1-admin-library-dirent'),

    ## admin::system-library
    url(r'^api/v2.1/admin/system-library/$', AdminSystemLibrary.as_view(), name='api-v2.1-admin-system-library'),
    url(r'^api/v2.1/admin/system-library/upload-link/$', AdminSystemLibraryUploadLink.as_view(), name='api-v2.1-admin-system-library-upload-link'),

    ## admin::trash-libraries
    url(r'^api/v2.1/admin/trash-libraries/$', AdminTrashLibraries.as_view(), name='api-v2.1-admin-trash-libraries'),
    url(r'^api/v2.1/admin/trash-libraries/(?P<repo_id>[-0-9a-f]{36})/$', AdminTrashLibrary.as_view(), name='api-v2.1-admin-trash-library'),

    ## admin::groups
    url(r'^api/v2.1/admin/groups/$', AdminGroups.as_view(), name='api-v2.1-admin-groups'),
    url(r'^api/v2.1/admin/groups/(?P<group_id>\d+)/$', AdminGroup.as_view(), name='api-v2.1-admin-group'),
    url(r'^api/v2.1/admin/search-group/$', AdminSearchGroup.as_view(), name='api-v2.1-admin-search-group'),
    url(r'^api/v2.1/admin/groups/(?P<group_id>\d+)/dtables/$', AdminGroupDTables.as_view(), name='api-v2.1-admin-group-dtable'),
    url(r'^api/v2.1/admin/groups/(?P<group_id>\d+)/dtables/(?P<table_id>\d+)/$', AdminGroupDTable.as_view(), name='api-v2.1-admin-group-dtable'),
    url(r'^api/v2.1/admin/groups/(?P<group_id>\d+)/members/$', AdminGroupMembers.as_view(), name='api-v2.1-admin-group-members'),
    url(r'^api/v2.1/admin/groups/(?P<group_id>\d+)/members/(?P<email>[^/]+)/$', AdminGroupMember.as_view(), name='api-v2.1-admin-group-member'),
    url(r'^api/v2.1/admin/groups/(?P<group_id>\d+)/storages/$', AdminGroupStorages.as_view(), name='api-v2.1-admin-group-storages'),


    ## admin::shares
    #url(r'^api/v2.1/admin/shares/$', AdminShares.as_view(), name='api-v2.1-admin-shares'),

    ## admin::admin logs
    url(r'^api/v2.1/admin/admin-logs/$', AdminOperationLogs.as_view(), name='api-v2.1-admin-admin-operation-logs'),
    url(r'^api/v2.1/admin/admin-login-logs/$', AdminLoginLogs.as_view(), name='api-v2.1-admin-admin-login-logs'),

    ## admin::share-links
    #url(r'^api/v2.1/admin/share-links/(?P<token>[a-f0-9]+)/$', AdminShareLink.as_view(), name='api-v2.1-admin-share-link'),
    #url(r'^api/v2.1/admin/share-links/(?P<token>[a-f0-9]+)/download/$',
    #        AdminShareLinkDownload.as_view(), name='api-v2.1-admin-share-link-download'),
    #url(r'^api/v2.1/admin/share-links/(?P<token>[a-f0-9]+)/check-password/$',
    #        AdminShareLinkCheckPassword.as_view(), name='api-v2.1-admin-share-link-check-password'),
    #url(r'^api/v2.1/admin/share-links/(?P<token>[a-f0-9]+)/dirents/$',
    #        AdminShareLinkDirents.as_view(), name='api-v2.1-admin-share-link-dirents'),

    ## admin::upload-links
    #url(r'^api/v2.1/admin/upload-links/(?P<token>[a-f0-9]+)/$', AdminUploadLink.as_view(), name='api-v2.1-admin-upload-link'),
    #url(r'^api/v2.1/admin/upload-links/(?P<token>[a-f0-9]+)/upload/$',
    #        AdminUploadLinkUpload.as_view(), name='api-v2.1-admin-upload-link-upload'),
    #url(r'^api/v2.1/admin/upload-links/(?P<token>[a-f0-9]+)/check-password/$',
    #        AdminUploadLinkCheckPassword.as_view(), name='api-v2.1-admin-upload-link-check-password'),

    ## admin::organizations
    url(r'^api/v2.1/admin/organizations/$', AdminOrganizations.as_view(), name='api-v2.1-admin-organizations'),
    url(r'^api/v2.1/admin/organizations/(?P<org_id>\d+)/$', AdminOrganization.as_view(), name='api-v2.1-admin-organization'),
    url(r'^api/v2.1/admin/organizations/(?P<org_id>\d+)/users/$', AdminOrgUsers.as_view(), name='api-v2.1-admin-org-users'),
    url(r'^api/v2.1/admin/organizations/(?P<org_id>\d+)/users/(?P<email>[^/]+)/$', AdminOrgUser.as_view(), name='api-v2.1-admin-org-user'),
    url(r'^api/v2.1/admin/organizations/(?P<org_id>\d+)/groups/$', AdminOrgGroups.as_view(), name='api-v2.1-admin-org-groups'),
    url(r'^api/v2.1/admin/search-organization/$', AdminSearchOrganization.as_view(), name='api-v2.1-admin-search-org'),

    ## admin::logo
    url(r'^api/v2.1/admin/logo/$', AdminLogo.as_view(), name='api-v2.1-admin-logo'),
    url(r'^api/v2.1/admin/favicon/$', AdminFavicon.as_view(), name='api-v2.1-admin-favicon'),
    url(r'^api/v2.1/admin/license/$', AdminLicense.as_view(), name='api-v2.1-admin-license'),
    url(r'^api/v2.1/admin/login-background-image/$', AdminLoginBgImage.as_view(), name='api-v2.1-admin-login-background-image'),

    ## admin::invitations
    url(r'^api/v2.1/admin/invitations/$', AdminInvitationsView.as_view(), name='api-v2.1-admin-invitations'),

    ## admin::dtables
    url(r'^api/v2.1/admin/dtables/$', AdminDtables.as_view(), name='api-v2.1-admin-dtables'),
    url(r'^api/v2.1/admin/trash-dtables/$', AdminTrashDTablesView.as_view(), name='api-v2.1-admin-trash-dtables'),
    url(r'^api/v2.1/admin/trash-dtables/(?P<dtable_id>\d+)/$', AdminTrashDTableView.as_view(), name='api-v2.1-admin-trash-dtable'),

    ## admin::external-links
    url(r'^api/v2.1/admin/external-links/$', AdminExternalLinks.as_view(), name='api-v2.1-admin-external-links'),
    url(r'^api/v2.1/admin/external-links/(?P<token>.*)/$', AdminExternalLink.as_view(), name='api-v2.1-admin-external-link'),

    # admin::statistics
    url(r'^api/v2.1/admin/statistics/active-users/$', ActiveUsersView.as_view(), name='api-v2.1-admin-statistics-active-users'),

    url(r'^notification/', include('seahub.notifications.urls')),
    #url(r'^contacts/', include('seahub.contacts.urls')),
    url(r'^options/', include('seahub.options.urls')),
    url(r'^profile/', include('seahub.profile.urls')),
    url(r'^captcha/', include('captcha.urls')),
    url(r'^thumbnail/', include('seahub.thumbnail.urls')),
    url(r'^inst/', include('seahub.institutions.urls', app_name='institutions', namespace='institutions')),
    url(r'^invite/', include('seahub.invitations.urls', app_name='invitations', namespace='invitations')),
    url(r'^terms/', include('termsandconditions.urls')),
    url(r'^work-weixin/', include('seahub.work_weixin.urls')),
    url(r'^weixin/', include('seahub.weixin.urls')),
    # Must specify a namespace if specifying app_name.
    url(r'^', include('seahub.dtable.urls', app_name='dtable', namespace='workspace')),

    ## admin::address book
    url(r'^api/v2.1/admin/address-book/groups/$', AdminAddressBookGroups.as_view(), name='api-v2.1-admin-address-book-groups'),
    url(r'^api/v2.1/admin/address-book/groups/(?P<group_id>\d+)/$', AdminAddressBookGroup.as_view(), name='api-v2.1-admin-address-book-group'),

    ## admin::file-scan-records
    #url(r'^api/v2.1/admin/file-scan-records/$', AdminFileScanRecords.as_view(), name='api-v2.1-admin-file-scan-records'),

    ## admin::notifications
    #url(r'^api/v2.1/admin/notifications/$', AdminNotificationsView.as_view(), name='api-2.1-admin-notifications'),
    url(r'^api/v2.1/admin/sys-notifications/$', AdminSysNotificationsView.as_view(), name='api-2.1-admin-sys-notifications'),
    url(r'^api/v2.1/admin/sys-notifications/(?P<nid>\d+)/$', AdminSysNotificationView.as_view(),name='api-2.1-admin-sys-notification'),

    ## admin::work weixin departments
    url(r'^api/v2.1/admin/work-weixin/departments/$', AdminWorkWeixinDepartments.as_view(), name='api-v2.1-admin-work-weixin-departments'),
    url(r'^api/v2.1/admin/work-weixin/departments/(?P<department_id>\d+)/members/$', AdminWorkWeixinDepartmentMembers.as_view(), name='api-v2.1-admin-work-weixin-department-members'),
    url(r'^api/v2.1/admin/work-weixin/users/batch/$', AdminWorkWeixinUsersBatch.as_view(), name='api-v2.1-admin-work-weixin-users'),
    url(r'^api/v2.1/admin/work-weixin/departments/import/$', AdminWorkWeixinDepartmentsImport.as_view(), name='api-v2.1-admin-work-weixin-department-import'),

    ### system admin ###
    #url(r'^sysadmin/$', sysadmin, name='sysadmin'),
    #url(r'^sys/settings/$', sys_settings, name='sys_settings'),
    #url(r'^sys/statistic/file/$', sys_statistic_file, name='sys_statistic_file'),
    #url(r'^sys/statistic/storage/$', sys_statistic_storage, name='sys_statistic_storage'),
    #url(r'^sys/statistic/user/$', sys_statistic_user, name='sys_statistic_user'),
    #url(r'^sys/statistic/traffic/$', sys_statistic_traffic, name='sys_statistic_traffic'),
    #url(r'^sys/statistic/reports/$', sys_statistic_reports, name='sys_statistic_reports'),

    #url(r'^sysadmin/#all-libs/$', fake_view, name='sys_repo_admin'),
    #url(r'^sysadmin/#libs/(?P<repo_id>[-0-9a-f]{36})/$', fake_view, name='sys_admin_repo'),
    #url(r'^sysadmin/#system-lib/$', fake_view, name='sys_list_system'),
    #url(r'^sysadmin/#trash-libs/$', fake_view, name='sys_repo_trash'),
    #url(r'^sysadmin/#search-libs/$', fake_view, name='sys_repo_search'),
    #url(r'^sysadmin/#search-trash-libs/$', fake_view, name='sys_trash_repo_search'),
    #url(r'^sysadmin/#search-groups/$', fake_view, name='sys_group_search'),
    #url(r'^sys/seafadmin/delete/(?P<repo_id>[-0-9a-f]{36})/$', sys_repo_delete, name='sys_repo_delete'),
    #url(r'^sys/useradmin/$', sys_user_admin, name='sys_useradmin'),
    url(r'^sys/useradmin/export-excel/$', sys_useradmin_export_excel, name='sys_useradmin_export_excel'),
    #url(r'^sys/useradmin/ldap/$', sys_user_admin_ldap, name='sys_useradmin_ldap'),
    #url(r'^sys/useradmin/ldap/imported$', sys_user_admin_ldap_imported, name='sys_useradmin_ldap_imported'),
    #url(r'^sys/useradmin/admins/$', sys_user_admin_admins, name='sys_useradmin_admins'),
    url(r'^sys/groupadmin/export-excel/$', sys_group_admin_export_excel, name='sys_group_admin_export_excel'),
    #url(r'^sys/orgadmin/$', sys_org_admin, name='sys_org_admin'),
    #url(r'^sys/orgadmin/search/$', sys_org_search, name='sys_org_search'),
    #url(r'^sys/orgadmin/(?P<org_id>\d+)/set_quota/$', sys_org_set_quota, name='sys_org_set_quota'),
    #url(r'^sys/orgadmin/(?P<org_id>\d+)/rename/$', sys_org_rename, name='sys_org_rename'),
    #url(r'^sys/orgadmin/(?P<org_id>\d+)/remove/$', sys_org_remove, name='sys_org_remove'),
    #url(r'^sys/orgadmin/(?P<org_id>\d+)/set_member_quota/$', sys_org_set_member_quota, name='sys_org_set_member_quota'),
    #url(r'^sys/orgadmin/(?P<org_id>\d+)/user/$', sys_org_info_user, name='sys_org_info_user'),
    #url(r'^sys/orgadmin/(?P<org_id>\d+)/group/$', sys_org_info_group, name='sys_org_info_group'),
    #url(r'^sys/orgadmin/(?P<org_id>\d+)/library/$', sys_org_info_library, name='sys_org_info_library'),
    #url(r'^sys/orgadmin/(?P<org_id>\d+)/traffic/$', sys_org_info_traffic, name='sys_org_info_traffic'),
    #url(r'^sys/orgadmin/(?P<org_id>\d+)/setting/$', sys_org_info_setting, name='sys_org_info_setting'),
    #url(r'^sys/instadmin/$', sys_inst_admin, name='sys_inst_admin'),
    #url(r'^sys/instadmin/(?P<inst_id>\d+)/remove/$', sys_inst_remove, name='sys_inst_remove'),
    #url(r'^sys/instadmin/(?P<inst_id>\d+)/users/$', sys_inst_info_user, name='sys_inst_info_users'),
    #url(r'^sys/instadmin/(?P<inst_id>\d+)/users/add/$', sys_inst_add_user, name='sys_inst_add_user'),
    #url(r'^sys/instadmin/(?P<inst_id>\d+)/users/search/$', sys_inst_search_user, name='sys_inst_search_user'),
    #url(r'^sys/instadmin/(?P<inst_id>\d+)/admins/$', sys_inst_info_admins, name='sys_inst_info_admins'),
    #url(r'^sys/instadmin/(?P<inst_id>\d+)/toggleadmin/(?P<email>[^/]+)/$', sys_inst_toggle_admin, name='sys_inst_toggle_admin'),
    #url(r'^sys/instadmin/(?P<inst_id>\d+)/set_quota/$', sys_inst_set_quota, name='sys_inst_set_quota'),
    #url(r'^sys/publinkadmin/$', sys_publink_admin, name='sys_publink_admin'),
    #url(r'^sys/publink/remove/$', sys_publink_remove, name='sys_publink_remove'),
    #url(r'^sys/uploadlinkadmin/$', sys_upload_link_admin, name='sys_upload_link_admin'),
    #url(r'^sys/uploadlink/remove/$', sys_upload_link_remove, name='sys_upload_link_remove'),
    #url(r'^sys/link-search/$', sys_link_search, name="sys_link_search"),
    #url(r'^sys/notificationadmin/', notification_list, name='notification_list'),
    #url(r'^sys/invitationadmin/$', sys_invitation_admin, name='sys_invitation_admin'),
    #url(r'^sys/invitationadmin/remove/$', sys_invitation_remove, name='sys_invitation_remove'),
    url(r'^sys/sudo/', sys_sudo_mode, name='sys_sudo_mode'),
    #url(r'^sys/check-license/', sys_check_license, name='sys_check_license'),
    #url(r'^useradmin/add/$', user_add, name="user_add"),
    #url(r'^useradmin/remove/(?P<email>[^/]+)/$', user_remove, name="user_remove"),
    #url(r'^useradmin/removetrial/(?P<user_or_org>[^/]+)/$', remove_trial, name="remove_trial"),
    #url(r'^useradmin/search/$', user_search, name="user_search"),
    #url(r'^useradmin/removeadmin/(?P<email>[^/]+)/$', user_remove_admin, name='user_remove_admin'),
    #url(r'^useradmin/info/(?P<email>[^/]+)/$', user_info, name='user_info'),
    #url(r'^useradmin/toggle_status/(?P<email>[^/]+)/$', user_toggle_status, name='user_toggle_status'),
    #url(r'^useradmin/toggle_role/(?P<email>[^/]+)/$', user_toggle_role, name='user_toggle_role'),
    #url(r'^useradmin/(?P<email>[^/]+)/set_quota/$', user_set_quota, name='user_set_quota'),
    #url(r'^sys/termsadmin/$', sys_terms_admin, name='sys_terms_admin'),
    #url(r'^sys/termsadmin/delete/(?P<pk>[^/]+)/$', sys_delete_terms, name='sys_delete_terms'),
    #url(r'^useradmin/password/reset/(?P<email>[^/]+)/$', user_reset, name='user_reset'),
    #url(r'^useradmin/batchmakeadmin/$', batch_user_make_admin, name='batch_user_make_admin'),
    #url(r'^useradmin/batchadduser/$', batch_add_user, name='batch_add_user'),
    url(r'^useradmin/batchadduser/example/$', batch_add_user_example, name='batch_add_user_example'),

    url(r'^sys/info/$', sysadmin_react_fake_view, name="sys_info"),
    url(r'^sys/desktop-devices/$', sysadmin_react_fake_view, name="sys_desktop_devices"),
    url(r'^sys/mobile-devices/$', sysadmin_react_fake_view, name="sys_mobile_devices"),
    url(r'^sys/device-errors/$', sysadmin_react_fake_view, name="sys_device_errors"),
    url(r'^sys/web-settings/$', sysadmin_react_fake_view, name="sys_web_settings"),
    url(r'^sys/all-libraries/$', sysadmin_react_fake_view, name="sys_all_libraries"),
    url(r'^sys/system-library/$', sysadmin_react_fake_view, name="sys_system_library"),
    url(r'^sys/trash-libraries/$', sysadmin_react_fake_view, name="sys_trash_libraries"),
    url(r'^sys/libraries/(?P<repo_id>[-0-9a-f]{36})/$', sysadmin_react_fake_view, name="sys_libraries_template"),
    url(r'^sys/libraries/(?P<repo_id>[-0-9a-f]{36})/(?P<repo_name>[^/]+)/(?P<path>.*)$', sysadmin_react_fake_view, name="sys_libraries_template_dirent"),

    url(r'^sys/users/$', sysadmin_react_fake_view, name="sys_users"),
    url(r'^sys/users/admins/$', sysadmin_react_fake_view, name="sys_users_admin"),
    url(r'^sys/users/(?P<email>[^/]+)/$', sysadmin_react_fake_view, name="sys_user"),
    url(r'^sys/users/(?P<email>[^/]+)/groups/$', sysadmin_react_fake_view, name="sys_user_groups"),
    url(r'^sys/search-users/$', sysadmin_react_fake_view, name="sys_search_users"),
    url(r'^sys/all-dtables/$', sysadmin_react_fake_view, name="sys_all_dtables"),
    url(r'^sys/trash-dtables/$', sysadmin_react_fake_view, name="sys_deleted_dtables"),
    url(r'^sys/work-weixin/$', sysadmin_react_fake_view, name="sys_work_weixin"),
    url(r'^sys/organizations/$', sysadmin_react_fake_view, name="sys_organizations"),
    url(r'^sys/organizations/(?P<org_id>\d+)/info/$', sysadmin_react_fake_view, name="sys_organization_info"),
    url(r'^sys/organizations/(?P<org_id>\d+)/users/$', sysadmin_react_fake_view, name="sys_organization_users"),
    url(r'^sys/organizations/(?P<org_id>\d+)/groups/$', sysadmin_react_fake_view, name="sys_organization_groups"),
    url(r'^sys/search-organizations/$', sysadmin_react_fake_view, name="sys_search_orgs"),
    url(r'^sys/groups/$', sysadmin_react_fake_view, name="sys_groups"),
    url(r'^sys/groups/(?P<group_id>\d+)/dtables/$', sysadmin_react_fake_view, name="sys_group_dtables"),
    url(r'^sys/groups/(?P<group_id>\d+)/members/$', sysadmin_react_fake_view, name="sys_group_members"),
    url(r'^sys/groups/(?P<group_id>\d+)/storages/(?P<path>.*)$', sysadmin_react_fake_view, name="sys_group_storage"),
    url(r'^sys/external-links/$', sysadmin_react_fake_view, name="sys_external_links"),
    url(r'^sys/search-groups/$', sysadmin_react_fake_view, name="sys_search_groups"),
    url(r'^sys/notifications/$', sysadmin_react_fake_view, name="sys_notifications"),
    url(r'^sys/admin-logs/operation/$', sysadmin_react_fake_view, name="sys_admin_operation"),
    url(r'^sys/admin-logs/login/$', sysadmin_react_fake_view, name="sys_admin_operation"),
    url(r'^sys/statistics/users/$', sysadmin_react_fake_view, name="sys_admin_statistics_users"),
]


if settings.SERVE_STATIC:
    from django.views.static import serve as static_view
    media_url = settings.MEDIA_URL.strip('/')
    urlpatterns += [
        url(r'^%s/(?P<path>.*)$' % (media_url), static_view,
            {'document_root': settings.MEDIA_ROOT}),
    ]

urlpatterns += [
    url(r'^demo/', demo),
]


if getattr(settings, 'MULTI_TENANCY', False):
    urlpatterns += [
        url(r'^api/v2.1/org/', include('seahub.organizations.api_urls')),
        url(r'^org/', include('seahub.organizations.urls')),
    ]


if getattr(settings, 'ENABLE_SHIB_LOGIN', False):
    urlpatterns += [
        url(r'^shib-complete/', TemplateView.as_view(template_name='shibboleth/complete.html'), name="shib_complete"),
        url(r'^shib-success/', TemplateView.as_view(template_name="shibboleth/success.html"), name="shib_success"),
    ]


if getattr(settings, 'ENABLE_KRB5_LOGIN', False):
    urlpatterns += [
        url(r'^krb5-login/', shib_login, name="krb5_login"),
    ]

# saml urls in seahub, not used in dtable
# if getattr(settings, 'ENABLE_ADFS_LOGIN', False):
#     from seahub_extra.adfs_auth.views import assertion_consumer_service, \
#         auth_complete
#     urlpatterns += [
#         url(r'^saml2/acs/$', assertion_consumer_service, name='saml2_acs'),
#         url(r'^saml2/complete/$', auth_complete, name='saml2_complete'),
#         url(r'^saml2/', include('djangosaml2.urls')),
#     ]

if is_pro_version() and getattr(settings, 'ENABLE_SAML', False):
    urlpatterns += [
        url(r'^saml/', include('seahub.saml.urls')),
    ]


if getattr(settings, 'ENABLE_CAS', False):
    from seahub_extra.django_cas_ng.views import login as cas_login
    from seahub_extra.django_cas_ng.views import logout as cas_logout
    from seahub_extra.django_cas_ng.views import callback as cas_callback
    urlpatterns += [
        url(r'^accounts/cas-login/$', cas_login, name='cas_ng_login'),
        url(r'^accounts/cas-logout/$', cas_logout, name='cas_ng_logout'),
        url(r'^accounts/cas-callback/$', cas_callback, name='cas_ng_proxy_callback'),
    ]
