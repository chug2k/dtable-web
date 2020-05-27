import React from 'react';
import ReactDOM from 'react-dom';
import { Utils } from './utils/utils';
import { gettext, isPro, siteRoot, mediaUrl, logoPath, logoWidth, logoHeight, siteTitle } from './utils/constants';
import { dtableWebAPI } from './utils/dtable-web-api';
import toaster from './components/toast';
import SideNav from './components/user-settings/side-nav';
import UserAvatarForm from './components/user-settings/user-avatar-form';
import UserBasicInfoForm from './components/user-settings/user-basic-info-form';
import WebdavPassword from './components/user-settings/webdav-password';
import LanguageSetting from './components/user-settings/language-setting';
import ListInAddressBook from './components/user-settings/list-in-address-book';
import TwoFactorAuthentication from './components/user-settings/two-factor-auth';
import SocialLogin from './components/user-settings/social-login';
import DeleteAccount from './components/user-settings/delete-account';
import BindPhone from './components/user-settings/bind-phone';
import EmailNotice from './components/user-settings/email-notice';
import Account from './components/common/account';
import Notification from './components/common/notification';
import SearchDtable from './pages/dtable/search/search-dtable';

import './css/toolbar.css';
import './css/search.css';

import './css/user-settings.css';
import './css/dtable-search.css';

const { 
  canUpdatePassword, passwordOperationText, userUnusablePassword,
  enableAddressBook,
  enableWebdavSecret,
  twoFactorAuthEnabled,
  enableWorkWeixin,
  enableWeixin,
  enableDeleteAccount,
  enableBindPhone
} = window.app.pageOptions;

class Settings extends React.Component {

  constructor(props) {
    super(props);
    this.sideNavItems = [
      {show: true, href: '#user-basic-info', text: gettext('Profile')},
      {show: canUpdatePassword, href: '#update-user-passwd', text: gettext('Password')},
      {show: enableBindPhone, href: '#bind-phone', text: gettext('Bind Phone Number')},
      {show: enableWebdavSecret, href: '#update-webdav-passwd', text: gettext('WebDav Password')},
      {show: enableAddressBook, href: '#list-in-address-book', text: gettext('Global Address Book')},
      {show: true, href: '#lang-setting', text: gettext('Language')},
      {show: isPro, href: '#email-notice', text: gettext('Email Notification')},
      {show: twoFactorAuthEnabled, href: '#two-factor-auth', text: gettext('Two-Factor Authentication')},
      {show: (enableWorkWeixin || enableWeixin), href: '#social-auth', text: gettext('Social Login')},
      {show: enableDeleteAccount, href: '#del-account', text: gettext('Delete Account')},
    ];

    this.state = {
      curItemID: this.sideNavItems[0].href.substr(1),
      userInfo: null,
    };
  }

  componentDidMount() {
    dtableWebAPI.getUserInfo().then((res) => {
      this.setState({userInfo: res.data});
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }
  
  updateUserInfo = (data) => {
    dtableWebAPI.updateUserInfo(data).then((res) => {
      this.setState({userInfo: res.data});
      toaster.success(gettext('Success'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  onSearchedClick = (item) => {
    let url = siteRoot + 'workspace/' + item.workspace_id + '/dtable/' + item.name + '/';
    location.href = url;
  }

  handleContentScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const scrolled = this.sideNavItems.filter((item, index) => {
      return item.show && document.getElementById(item.href.substr(1)).offsetTop - 45 < scrollTop;
    });
    if (scrolled.length) {
      this.setState({
        curItemID: scrolled[scrolled.length -1].href.substr(1)
      });
    }
  }

  render() {
    let searchPlaceholder = gettext('Search bases');
    return (
      <React.Fragment>
        <div className="h-100 d-flex flex-column">
          <div className="top-header d-flex justify-content-between">
            <a href={siteRoot}>
              <img src={mediaUrl + logoPath} height={logoHeight} width={logoWidth} title={siteTitle} alt="logo" />
            </a>
            <div className="common-toolbar">
              <SearchDtable placeholder={searchPlaceholder} onSearchedClick={this.onSearchedClick}/>
              <Notification />
              <Account />
            </div>
          </div>
          <div className="flex-auto d-flex o-hidden">
            <div className="side-panel o-auto">
              <SideNav data={this.sideNavItems} curItemID={this.state.curItemID} />
            </div>
            <div className="main-panel d-flex flex-column">
              <h2 className="heading">{gettext('Settings')}</h2>
              <div className="content position-relative" onScroll={this.handleContentScroll}>
                <div id="user-basic-info" className="setting-item">
                  <h3 className="setting-item-heading">{gettext('Profile Setting')}</h3>
                  <UserAvatarForm  />
                  {this.state.userInfo && <UserBasicInfoForm userInfo={this.state.userInfo} updateUserInfo={this.updateUserInfo} />}
                </div>
                {canUpdatePassword &&
                <div id="update-user-passwd" className="setting-item">
                  <h3 className="setting-item-heading">{gettext('Password')}</h3>
                  {userUnusablePassword &&
                  <p>{gettext('You have not set a password yet. Setting a password and binding a phone number or an email will enable you to login via phone number or email.')}</p>}
                  <a href={`${siteRoot}accounts/password/change/`} className="btn btn-outline-primary">{passwordOperationText}</a>
                </div>
                }
                {enableBindPhone && this.state.userInfo && (
                  <BindPhone oldBindPhone={this.state.userInfo.bind_phone}/>
                )}
                {enableWebdavSecret && <WebdavPassword />}
                {enableAddressBook && this.state.userInfo && 
                <ListInAddressBook userInfo={this.state.userInfo} updateUserInfo={this.updateUserInfo} />}
                <LanguageSetting />
                {isPro && <EmailNotice />}
                {twoFactorAuthEnabled && <TwoFactorAuthentication />}
                {(enableWorkWeixin || enableWeixin) && <SocialLogin />}
                {enableDeleteAccount && <DeleteAccount />}
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

ReactDOM.render(
  <Settings />,
  document.getElementById('wrapper')
);
