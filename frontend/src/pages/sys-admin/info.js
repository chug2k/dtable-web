import React, { Component, Fragment } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import { gettext, isPro, isDefaultAdmin } from '../../utils/constants';
import toaster from '../../components/toast';
import { Utils } from '../../utils/utils';
import Loading from '../../components/loading';
import MainPanelTopbar from './main-panel-topbar';

import '../../css/system-info.css';

const propTypes = {
  onCloseSidePanel: PropTypes.func
};

class Info extends Component {

  constructor(props) {
    super(props);
    this.fileInput = React.createRef();
    this.state = {
      loading: true,
      errorMsg: '',
      sysInfo: {}
    };
  }

  componentDidMount () {
    dtableWebAPI.sysAdminGetSysInfo().then((res) => {
      this.setState({
        loading: false,
        sysInfo: res.data
      });
    }).catch((error) => {
      if (error.response) {
        if (error.response.status === 403) {
          this.setState({
            loading: false,
            errorMsg: gettext('Permission denied')
          });
        } else {
          this.setState({
            loading: false,
            errorMsg: gettext('Error')
          });
        }
      } else {
        this.setState({
          loading: false,
          errorMsg: gettext('Please check the network.')
        });
      }
    });
  }

  uploadLicenseFile = (e) => {

    // no file selected
    if (!this.fileInput.current.files.length) {
      return;
    }
    const file = this.fileInput.current.files[0];
    dtableWebAPI.sysAdminUploadLicense(file).then((res) => {
      let info = this.state.sysInfo;
      Object.assign(info, res.data, {with_license: true});
      this.setState({
        sysInfo: info
      });
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error);
      toaster.danger(errMsg);
    });
  }

  openFileInput = () => {
    this.fileInput.current.click();
  }

  renderLicenseDescString = (license_mode, license_to, license_expiration) => {
    if (license_mode === 'life-time') {
      if (window.app.config.lang === 'zh-cn') {
        return '永久授权给 ' + license_to + '，技术支持服务至 ' + license_expiration + ' 到期';
      } else {
        return gettext('licensed to ') + license_to + ', ' + gettext('upgrade service expired in ') + license_expiration;
      }
    } else {
      return gettext('licensed to ') + license_to + ', ' + gettext('expires on ') + license_expiration;
    }
  }

  render() {
    let { license_mode, license_to, license_expiration, org_count, license_maxusers, multi_tenancy_enabled,
      active_users_count, users_count, groups_count, with_license, dtables_count, dtable_server_info,
      version } = this.state.sysInfo;
    let { loading, errorMsg } = this.state;

    return (
      <Fragment>
        <MainPanelTopbar onCloseSidePanel={this.props.onCloseSidePanel} />
        <div className="main-panel-center flex-row">
          <div className="cur-view-container system-admin-info">
            <h2 className="heading">{gettext('Info')}</h2>
            <div className="content">
              {loading && <Loading />}
              {errorMsg && <p className="error text-center mt-4">{errorMsg}</p>}
              {(!loading && !errorMsg) &&
              <dl className="m-0">
                <dt className="info-item-heading">{gettext('System Info')}</dt>
                {isPro ?
                  <dd className="info-item-content">
                    {gettext('Professional Edition')}
                    {with_license &&
                      ' ' + this.renderLicenseDescString(license_mode, license_to, license_expiration)
                    }<br/>
                    {isDefaultAdmin &&
                      <Fragment>
                        <Button type="button" className="mt-2" onClick={this.openFileInput}>{gettext('Upload license')}</Button>
                        <input className="d-none" type="file" onChange={this.uploadLicenseFile} ref={this.fileInput} />
                      </Fragment>
                    }
                  </dd> :
                  <dd className="info-item-content">
                    {gettext('Community Edition')}
                    <a className="ml-1" href="http://manual.seafile.com/deploy_pro/migrate_from_seafile_community_server.html" target="_blank" rel='noreferrer noopener'>{gettext('Upgrade to Pro Edition')}</a>
                  </dd>
                }
                <dt className="info-item-heading">{gettext('Version Info')}</dt>
                <dd className="info-item-content">{version}</dd>

                <dt className="info-item-heading">{gettext('Tables')}</dt>
                <dd className="info-item-content">{dtables_count}</dd>

                {isPro ?
                  <Fragment>
                    <dt className="info-item-heading">{gettext('Activated Users')} / {gettext('Total Users')} / {gettext('Limits')}</dt>
                    <dd className="info-item-content">{active_users_count}{' / '}{users_count}{' / '}{with_license ? license_maxusers : '--'}</dd>
                  </Fragment> :
                  <Fragment>
                    <dt className="info-item-heading">{gettext('Activated Users')} / {gettext('Total Users')}</dt>
                    <dd className="info-item-content">{active_users_count} / {users_count}</dd>
                  </Fragment>
                }

                <dt className="info-item-heading">{gettext('Groups')}</dt>
                <dd className="info-item-content">{groups_count}</dd>

                {multi_tenancy_enabled &&
                  <Fragment>
                    <dt className="info-item-heading">{gettext('Organizations')}</dt>
                    <dd className="info-item-content">{org_count}</dd>
                  </Fragment>
                }
                <dt className="info-item-heading">{gettext('Table server info')}</dt>
                <dd className="info-item-content">
                  <table>
                    <thead>
                      <tr>
                        <th width="70%">{gettext('Item')}</th>
                        <th width="30%">{gettext('Value')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{gettext('Number of websocket connections')}</td>
                        <td>{dtable_server_info.web_socket_count}</td>
                      </tr>
                      <tr>
                        <td>{gettext('Number of App Connections')}</td>
                        <td>{dtable_server_info.app_connection_count}</td>
                      </tr>
                      <tr>
                        <td>{gettext('Number of loaded tables')}</td>
                        <td>{dtable_server_info.loaded_dtables_count}</td>
                      </tr>
                      <tr>
                        <td>{gettext('Number of operations in the last hour')}</td>
                        <td>{dtable_server_info.last_period_operations_count}</td>
                      </tr>
                      <tr>
                        <td>{gettext('Number of total operations (since start up)')}</td>
                        <td>{dtable_server_info.operation_count_since_up}</td>
                      </tr>
                      <tr>
                        <td>{gettext('Number of last saved tables')}</td>
                        <td>{dtable_server_info.last_dtable_saving_count}</td>
                      </tr>
                      <tr>
                        <td>{gettext('Last save start time')}</td>
                        <td>{dtable_server_info.last_dtable_saving_start_time ?
                          moment(dtable_server_info.last_dtable_saving_start_time).format('YYYY-MM-DD HH:mm')
                          : 
                          ''}
                        </td>
                      </tr>
                      <tr>
                        <td>{gettext('Time taken for the last save')}</td>
                        <td>{(dtable_server_info.last_dtable_saving_end_time && dtable_server_info.last_dtable_saving_start_time) ?
                          ((dtable_server_info.last_dtable_saving_end_time - dtable_server_info.last_dtable_saving_start_time) / 1000).toString() + ' s' 
                          :  
                          ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </dd>
              </dl>
              }
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

Info.propTypes = propTypes;

export default Info;
