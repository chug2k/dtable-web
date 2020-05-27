import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from '@reach/router';
import { helpLink, cloudMode, isOrgContext, showWechatSupportGroup, seatableMarketUrl, mediaUrl, logoPath, logoWidth, logoHeight, siteTitle } from '../../utils/constants';
import WechatDialog from './dialog/wechat-dialog';

const gettext = window.gettext;
const siteRoot = window.app.config.siteRoot;

const propTypes = {
  isSidePanelClosed: PropTypes.bool.isRequired,
  currentTab: PropTypes.string.isRequired,
  onTabClick: PropTypes.func.isRequired,
  onCloseSidePanel: PropTypes.func.isRequired
};

class SidePanel extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowWechatDialog: false
    };
  }

  toggleWechatDialog = () => {
    this.setState({
      isShowWechatDialog: !this.state.isShowWechatDialog
    });
  }

  onTabClick = (tab) => {
    this.props.onTabClick(tab);
    this.props.onCloseSidePanel();
  }

  getActiveClass = (tab) => {
    return this.props.currentTab === tab ? 'active' : '';
  }

  onOpenSeaTableMarket = () => {
    window.open(seatableMarketUrl);
  }

  render() {
    return (
      <div className={`side-panel ${this.props.isSidePanelClosed ? '' : 'left-zero'}`}>
        <div className="side-panel-north dtable-header">
          <a className="dtable-logo" href={siteRoot}>
            <img src={mediaUrl + logoPath} height={logoHeight} width={logoWidth} title={siteTitle} alt="logo" />
          </a>
        </div>
        <div className="side-panel-center">
          <div className="dtable-side-nav">
            <ul className="nav nav-pills flex-column dtable-nav-list">
              <li className={`nav-item dtable-nav-item ${this.getActiveClass('dtable')}`} title={gettext('Tables')} onClick={this.onTabClick.bind(this, 'dtable')}>
                <Link to={siteRoot + 'dtable/'} className="nav-link dtable-nav-link">
                  <span className="dtable-font dtable-icon-dtable-logo nav-icon"></span>
                  <span className="nav-text">{gettext('Tables')}</span>
                </Link>
              </li>
              {(!cloudMode || isOrgContext) && 
              <li className={`nav-item dtable-nav-item ${this.getActiveClass('forms')}`} title={gettext('Forms')} onClick={this.onTabClick.bind(this, 'forms')}>
                <Link to={siteRoot + 'forms/'} className="nav-link dtable-nav-link">
                  <span className="dtable-font dtable-icon-form nav-icon"></span>
                  <span className="nav-text">{gettext('Forms')}</span>
                </Link>
              </li>
              }
              <li className={`nav-item dtable-nav-item ${this.getActiveClass('activities')}`} title={gettext('Activities')} onClick={this.onTabClick.bind(this, 'activities')}>
                <Link to={siteRoot + 'activities/'} className="nav-link dtable-nav-link">
                  <span className="dtable-font dtable-icon-modification-record nav-icon"></span>
                  <span className="nav-text">{gettext('Activities')}</span>
                </Link>
              </li>
              {(!cloudMode || isOrgContext) && 
              <li className={`nav-item dtable-nav-item ${this.getActiveClass('common-datasets')}`} title={gettext('Common Datasets')} onClick={this.onTabClick.bind(this, 'common-datasets')}>
                <Link to={siteRoot + 'common-datasets/'} className="nav-link dtable-nav-link">
                  <span className="dtable-font dtable-icon-common-dataset nav-icon"></span>
                  <span className="nav-text">{gettext('Common Datasets')}</span>
                </Link>
              </li>
              }
              {seatableMarketUrl && (
                <li className={`nav-item dtable-nav-item ${this.getActiveClass('templates')}`} title={gettext('Templates')}>
                  <span className="nav-link dtable-nav-link" onClick={this.onOpenSeaTableMarket}>
                    <span className="dtable-font dtable-icon-templates nav-icon"></span>
                    <span className="nav-text">{gettext('Templates')}</span>
                  </span>
                </li>
              )}
              <li className={`nav-item dtable-nav-item ${this.getActiveClass('help')}`} title={gettext('help')} onClick={this.onTabClick.bind(this, 'help')}>
                <a className="nav-link dtable-nav-link" href={helpLink}>
                  <span className="dtable-font dtable-icon-use-help nav-icon"></span>
                  <span className="nav-text">{gettext('Help')}</span>
                </a>
              </li>

              {/* <li className={`nav-item dtable-nav-item ${this.getActiveClass('apps')}`} title={gettext('Apps')} onClick={this.onTabClick.bind(this, 'apps')}>
                <Link to={siteRoot + 'dtable/apps/'} className="nav-link dtable-nav-link">
                  <span className="dtable-font dtable-icon-apps nav-icon"></span>
                  <span className="nav-text">{gettext('Apps')}</span>
                </Link>
              </li>
              <li className={`nav-item dtable-nav-item ${this.getActiveClass('templetes')}`} title={gettext('Templetes')} onClick={this.onTabClick.bind(this, 'templetes')}>
                <Link to={siteRoot + 'dtable/templetes/'} className="nav-link dtable-nav-link">
                  <span className="dtable-font dtable-icon-templates nav-icon"></span>
                  <span className="nav-text">{gettext('Templates')}</span>
                </Link>
              </li> */}
            </ul>
          </div>
        </div>
        {showWechatSupportGroup && (
          <Fragment>
            <div className="side-panel-footer">
              <div className="side-nav-footer" onClick={this.toggleWechatDialog} >
                <i className="dtable-font dtable-icon-hi join-us-icon" />加入 SeaTable 微信咨询群
              </div>
            </div>
            {this.state.isShowWechatDialog && 
              <WechatDialog 
                toggleWechatDialog={this.toggleWechatDialog}
              />
            }
          </Fragment>
        )}
      </div>
    );
  }
}

SidePanel.propTypes = propTypes;

export default SidePanel;
