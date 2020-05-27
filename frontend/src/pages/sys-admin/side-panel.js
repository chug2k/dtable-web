import React from 'react';
import PropTypes from 'prop-types';
import { Link } from '@reach/router';
import Logo from '../../components/logo';
import { gettext, siteRoot, isPro, isDefaultAdmin, canViewSystemInfo,
  canManageUser, canManageGroup, canManageExternalLink, canViewUserLog,
  canViewAdminLog, multiTenancy, multiInstitution, sysadminExtraEnabled,
  enableGuestInvitation, enableTermsAndConditions, enableFileScan, enableWorkWeixin,
  constanceEnabled, canConfigSystem } from '../../utils/constants';

const propTypes = {
  isSidePanelClosed: PropTypes.bool.isRequired,
  onCloseSidePanel: PropTypes.func.isRequired,
  currentTab: PropTypes.string.isRequired,
  tabItemClick: PropTypes.func.isRequired
};

class SidePanel extends React.Component {

  getActiveClass = (tab) => {
    return this.props.currentTab === tab ? 'active' : '';
  }

  render() {
    return (
      <div className={`side-panel ${this.props.isSidePanelClosed ? '' : 'left-zero'}`}>
        <div className="side-panel-north">
          <Logo onCloseSidePanel={this.props.onCloseSidePanel}/>
        </div>
        <div className="side-panel-center">
          <div className="side-nav">
            <div className="side-nav-con">
              <h3 className="sf-heading">{gettext('System Admin')}</h3>
              <ul className="nav nav-pills flex-column nav-container">
                {canViewSystemInfo &&
                <li className="nav-item">
                  <Link
                    className={`nav-link ellipsis ${this.getActiveClass('info')}`}
                    to={siteRoot + 'sys/info/'}
                    onClick={() => this.props.tabItemClick('info')}
                  >
                    <span className="dtable-font dtable-icon-info" aria-hidden="true"></span>
                    <span className="nav-text">{gettext('Info')}</span>
                  </Link>
                </li>
                }
                {isDefaultAdmin &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('dtables')}`}
                      to={siteRoot + 'sys/all-dtables/'}
                      onClick={() => this.props.tabItemClick('dtables')}
                    >
                      <span className="dtable-font dtable-icon-dtable-logo" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Tables')}</span>
                    </Link>
                  </li>
                }
                {isDefaultAdmin &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('statistics')}`}
                      to={siteRoot + 'sys/statistics/users/'}
                      onClick={() => this.props.tabItemClick('statistics')}
                    >
                      <span className="dtable-font dtable-icon-statistic" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Statistic')}</span>
                    </Link>
                  </li>
                }
                {constanceEnabled && canConfigSystem &&
                  <li className="nav-item">
                    <Link 
                      className={`nav-link ellipsis ${this.getActiveClass('web-settings')}`}
                      to={siteRoot + 'sys/web-settings/'}
                      onClick={() => this.props.tabItemClick('web-settings')}
                    >
                      <span className="dtable-font dtable-icon-settings" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Settings')}</span>
                    </Link>
                  </li>
                }
                {canManageUser &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('users')}`}
                      to={siteRoot + 'sys/users/'}
                      onClick={() => this.props.tabItemClick('users')}
                    >
                      <span className="dtable-font dtable-icon-mine" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Users')}</span>
                    </Link>
                  </li>
                }
                {canManageGroup &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('groups')}`}
                      to={siteRoot + 'sys/groups/'}
                      onClick={() => this.props.tabItemClick('groups')}
                    >
                      <span className="dtable-font dtable-icon-groups" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Groups')}</span>
                    </Link>
                  </li>
                }
                {canManageExternalLink &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('externalLinks')}`}
                      to={siteRoot + 'sys/external-links/'}
                      onClick={() => this.props.tabItemClick('externalLinks')}
                    >
                      <span className="dtable-font dtable-icon-share" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('External Links')}</span>
                    </Link>
                  </li>
                }
                {multiTenancy && isDefaultAdmin &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('organizations')}`}
                      to={siteRoot + 'sys/organizations/'}
                      onClick={() => this.props.tabItemClick('organizations')}
                    >
                      <span className="dtable-font dtable-icon-organization" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Organizations')}</span>
                    </Link>
                  </li>
                }
                {multiInstitution && isDefaultAdmin &&
                  <li className="nav-item">
                    <a className='nav-link ellipsis' href={siteRoot + 'sys/instadmin/'}>
                      <span className="dtable-font dtable-icon-organizationn" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Institutions')}</span>
                    </a>
                  </li>
                }
                {isDefaultAdmin &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('notifications')}`}
                      to={siteRoot + 'sys/notifications/'}
                      onClick={() => this.props.tabItemClick('notifications')}
                    >
                      <span className="dtable-font dtable-icon-discussion" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Notifications')}</span>
                    </Link>
                  </li>
                }
                {isPro && canViewAdminLog &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('adminLogs')}`}
                      to={siteRoot + 'sys/admin-logs/operation'}
                      onClick={() => this.props.tabItemClick('adminLogs')}
                    >
                      <span className="dtable-font dtable-icon-admin-op-log" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Admin Logs')}</span>
                    </Link>
                  </li>
                }
                {sysadminExtraEnabled && canViewUserLog &&
                  <li className="nav-item">
                    <a className='nav-link ellipsis' href={siteRoot + 'sys/loginadmin/'}>
                      <span className="sf2-icon-clock" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Logs')}</span>
                    </a>
                  </li>
                }
                {isPro && isDefaultAdmin && enableFileScan &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('file-scan-records')}`}
                      to={siteRoot + 'sys/file-scan-records/'}
                      onClick={() => this.props.tabItemClick('file-scan-records')}
                    >
                      <span className="sf2-icon-security" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('File Scan')}</span>
                    </Link>
                  </li>
                }
                {enableGuestInvitation && isDefaultAdmin &&
                  <li className="nav-item">
                    <a className='nav-link ellipsis' href={siteRoot + 'sys/invitationadmin/'}>
                      <span className="dtable-font dtable-icon-invite" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Invitations')}</span>
                    </a>
                  </li>
                }
                {isDefaultAdmin && enableTermsAndConditions &&
                  <li className="nav-item">
                    <a className='nav-link ellipsis' href={siteRoot + 'sys/termsadmin/'}>
                      <span className="sf2-icon-wiki" aria-hidden="true"></span>
                      <span className="nav-text">{gettext('Terms and Conditions')}</span>
                    </a>
                  </li>
                }
                {isDefaultAdmin && enableWorkWeixin &&
                  <li className="nav-item">
                    <Link
                      className={`nav-link ellipsis ${this.getActiveClass('work-weixin')}`}
                      to={siteRoot + 'sys/work-weixin/'}
                      onClick={() => this.props.tabItemClick('work-weixin')}
                    >
                      <span className="dtable-font dtable-icon-enterprise-wechat" aria-hidden="true"></span>
                      <span className="nav-text">{'企业微信集成'}</span>
                    </Link>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SidePanel.propTypes = propTypes;

export default SidePanel;
