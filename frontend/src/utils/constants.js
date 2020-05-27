export const gettext = window.gettext;

export const isPro = window.app.config.isPro === 'True';
export const siteRoot = window.app.config.siteRoot;
export const loginUrl = window.app.config.loginUrl;
export const mediaUrl = window.app.config.mediaUrl;
export const siteTitle = window.app.config.siteTitle;
export const siteName = window.app.config.siteName;
export const logoPath =  window.app.config.logoPath;
export const logoWidth = window.app.config.logoWidth;
export const logoHeight = window.app.config.logoHeight;
export const lang = window.app.config.lang;
export const seafileVersion = window.app.config.seafileVersion;
export const serviceURL = window.app.config.serviceURL;
export const appAvatarURL = window.app.config.avatarURL;
export const faviconPath = window.app.config.faviconPath;
export const loginBGPath = window.app.config.loginBGPath;

//pageOptions
export const name = window.app.pageOptions.name;
export const contactEmail = window.app.pageOptions.contactEmail;
export const username = window.app.pageOptions.username;
export const canAddGroup = window.app.pageOptions.canAddGroup;
export const canAddDTable = window.app.pageOptions.canAddDTable;
export const canGenerateShareLink = window.app.pageOptions.canGenerateShareLink;
export const canGenerateExternalLink = window.app.pageOptions.canGenerateExternalLink;
export const canGenerateUploadLink = window.app.pageOptions.canGenerateUploadLink;
export const canSendShareLinkEmail = window.app.pageOptions.canSendShareLinkEmail;
export const canViewOrg = window.app.pageOptions.canViewOrg === 'True';
export const fileAuditEnabled = window.app.pageOptions.fileAuditEnabled;
export const enableFileComment = window.app.pageOptions.enableFileComment ? true : false;
export const folderPermEnabled = window.app.pageOptions.folderPermEnabled;
export const thumbnailSizeForOriginal = window.app.pageOptions.thumbnailSizeForOriginal;
export const canInvitePeople = window.app.pageOptions.canInvitePeople;

export const curNoteMsg = window.app.pageOptions.curNoteMsg;
export const curNoteID = window.app.pageOptions.curNoteID;


// dtable
export const workspaceID = window.app.pageOptions.workspaceID;
export const showWechatSupportGroup = window.app.pageOptions.showWechatSupportGroup;
export const seatableMarketUrl = window.app.pageOptions.seatableMarketUrl;

export const helpLink = window.app.pageOptions.helpLink;
export const cloudMode = window.app.pageOptions.cloudMode;
export const isOrgContext = window.app.pageOptions.isOrgContext;
export const orgName = window.app.pageOptions.orgName;

// org admin
export const orgID = window.org ? window.org.pageOptions.orgID : '';
export const invitationLink = window.org ? window.org.pageOptions.invitationLink : '';
export const orgMemberQuotaEnabled = window.org ? window.org.pageOptions.orgMemberQuotaEnabled : '';

// sys admin
export const storages = window.app.pageOptions.storages; // storage backends
export const constanceEnabled = window.sysadmin ? window.sysadmin.pageOptions.constance_enabled : '';
export const multiTenancy = window.sysadmin ? window.sysadmin.pageOptions.multi_tenancy : '';
export const multiInstitution = window.sysadmin ? window.sysadmin.pageOptions.multi_institution : '';
export const sysadminExtraEnabled = window.sysadmin ? window.sysadmin.pageOptions.sysadmin_extra_enabled : '';
export const enableGuestInvitation = window.sysadmin ? window.sysadmin.pageOptions.enable_guest_invitation : '';
export const enableTermsAndConditions = window.sysadmin ? window.sysadmin.pageOptions.enable_terms_and_conditions : '';
export const isDefaultAdmin = window.sysadmin ? window.sysadmin.pageOptions.is_default_admin : '';
export const enableFileScan = window.sysadmin ? window.sysadmin.pageOptions.enable_file_scan : '';
export const canViewSystemInfo = window.sysadmin ? window.sysadmin.pageOptions.admin_permissions.can_view_system_info : '';
export const canViewStatistic = window.sysadmin ? window.sysadmin.pageOptions.admin_permissions.can_view_statistic : '';
export const canConfigSystem = window.sysadmin ? window.sysadmin.pageOptions.admin_permissions.can_config_system : '';
export const canManageLibrary = window.sysadmin ? window.sysadmin.pageOptions.admin_permissions.can_manage_library : '';
export const canManageUser = window.sysadmin ? window.sysadmin.pageOptions.admin_permissions.can_manage_user : '';
export const canManageGroup = window.sysadmin ? window.sysadmin.pageOptions.admin_permissions.can_manage_group : '';
export const canManageExternalLink = window.sysadmin ? window.sysadmin.pageOptions.admin_permissions.can_manage_external_link : '';
export const canViewUserLog = window.sysadmin ? window.sysadmin.pageOptions.admin_permissions.can_view_user_log : '';
export const canViewAdminLog = window.sysadmin ? window.sysadmin.pageOptions.admin_permissions.can_view_admin_log : '';
export const enableWorkWeixin = window.sysadmin ? window.sysadmin.pageOptions.enable_work_weixin : '';

