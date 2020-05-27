import React, { Fragment } from 'react';
import { gettext, siteRoot } from '../../utils/constants';
import ModalPortal from '../modal-portal';
import ConfirmDisconnectWechat from '../dialog/confirm-disconnect-wechat';

const {
  csrfToken,
  langCode,
  enableWorkWeixin,
  enableWeixin,
  workWixinConnected,
  wixinConnected,
  socialNextPage
} = window.app.pageOptions;

class SocialLogin extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isConfirmDialogOpen: false,
      disconnectType: '',
    };
  }

  confirmDisconnect = (disconnectType) => {
    this.setState({
      isConfirmDialogOpen: true,
      disconnectType: disconnectType,
    });
  }

  toggleDialog = () => {
    this.setState({
      isConfirmDialogOpen: !this.state.isConfirmDialogOpen
    });
  }

  render() {
    const disconnectUrl = this.state.disconnectType === 'workWeixin' ?
      `${siteRoot}work-weixin/oauth-disconnect/?next=${encodeURIComponent(socialNextPage)}` :
      `${siteRoot}weixin/oauth-disconnect/?next=${encodeURIComponent(socialNextPage)}`;

    return (
      <Fragment>
        <div className="setting-item" id="social-auth">
          <h3 className="setting-item-heading">{gettext('Social Login')}</h3>
          {enableWorkWeixin &&
            <div className="mb-4">
              <p className="mb-2">{langCode === 'zh-cn' ? '企业微信' : 'Work Weixin'}</p>
              {workWixinConnected ?
                <button className="btn btn-outline-primary" onClick={this.confirmDisconnect.bind(this, 'workWeixin')}>{gettext('Disconnect')}</button> :
                <a href={`${siteRoot}work-weixin/oauth-connect/?next=${encodeURIComponent(socialNextPage)}`} className="btn btn-outline-primary">{gettext('Connect')}</a>}
            </div>
          }
          {enableWeixin &&
            <div className="mb-4">
              <p className="mb-2">{langCode === 'zh-cn' ? '微信' : 'WeChat'}</p>
              {wixinConnected ?
                <button className="btn btn-outline-primary" onClick={this.confirmDisconnect.bind(this, 'weixin')}>{gettext('Disconnect')}</button> :
                <a href={`${siteRoot}weixin/oauth-connect/?next=${encodeURIComponent(socialNextPage)}`} className="btn btn-outline-primary">{gettext('Connect')}</a>}
            </div>
          }
        </div>
        {this.state.isConfirmDialogOpen && (
          <ModalPortal>
            <ConfirmDisconnectWechat
              formActionURL={disconnectUrl}
              csrfToken={csrfToken}
              toggle={this.toggleDialog}
            />
          </ModalPortal>
        )}
      </Fragment>
    );
  }
}

export default SocialLogin; 
