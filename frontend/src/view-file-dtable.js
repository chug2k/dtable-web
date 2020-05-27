import React from 'react';
import ReactDOM from 'react-dom';
import { dtableWebAPI } from './utils/dtable-web-api';
import ViewFileDtable from '@seafile/dtable/es';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n-dtable';
import toaster from './components/toast';
import { gettext } from './utils/constants';

const { siteRoot, mediaUrl, lang, loginUrl, dtableBaiduMapKey, dtableGoogleMapKey, dtableEnableGeolocationColumn } = window.app.config;
const { server, workspaceID, username, userNickName, contactEmail, fileName, filePath, dtableUuid,
  dtableServer, dtableSocket, shareLinkToken, externalLinkToken, permission, repoApiToken, seafileUrl, snapshotCommitID,
  canCreateCommonDataset, cloudMode, isOrgContext, seatableMarketUrl,
  canGenerateShareLink, canGenerateExternalLink, canInvitePeople, assetQuotaExceeded,
  isAdmin } = window.app.pageOptions;
window.dtable = {};
window.dtable = {
  workspaceID: workspaceID,
  siteRoot: siteRoot,
  username: username,
  name: userNickName,
  contactEmail: contactEmail,
  server: server,
  dtableServer: dtableServer,
  dtableSocket: dtableSocket,
  filePath: filePath,
  fileName: fileName,
  dtableUuid: dtableUuid,
  mediaUrl: mediaUrl,
  lang: lang,
  shareLinkToken: shareLinkToken,
  externalLinkToken: externalLinkToken,
  permission: permission,
  repoApiToken: repoApiToken,
  seafileUrl: seafileUrl,
  loginUrl: loginUrl,
  snapshotCommitID: snapshotCommitID,
  canCreateCommonDataset: canCreateCommonDataset,
  cloudMode: cloudMode,
  isOrgContext: isOrgContext,
  dtableBaiduMapKey,
  dtableGoogleMapKey,
  dtableEnableGeolocationColumn,
  seatableMarketUrl,
  canGenerateShareLink,
  canGenerateExternalLink,
  canInvitePeople,
  isAdmin
};

window.dtableWebAPI = dtableWebAPI;

class ViewFileSDB extends React.Component {

  componentDidMount() {
    if (assetQuotaExceeded) {
      toaster.warning(gettext('Your attachments has exceeded quota and all tables will be read-only.'));
    }
  }

  render() {
    return (
      <ViewFileDtable />
    );
  }
}

ReactDOM.render(
  <I18nextProvider i18n={ i18n }>
    <ViewFileSDB />
  </I18nextProvider>,
  document.getElementById('wrapper')
);
