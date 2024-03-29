import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Utils } from '../../../utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { loginUrl, gettext } from '../../../utils/constants';
import toaster from '../../../components/toast';
import Loading from '../../../components/loading';
import SysAdminSetOrgNameDialog from '../../../components/dialog/sysadmin-dialog/sysadmin-set-org-name-dialog';
import SysAdminSetOrgMaxUserNumberDialog from '../../../components/dialog/sysadmin-dialog/sysadmin-set-org-max-user-number-dialog';
import MainPanelTopbar from '../main-panel-topbar';
import OrgNav from './org-nav';

const contentPropTypes = {
  orgID: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  errorMsg: PropTypes.string,
  orgInfo: PropTypes.object.isRequired,
  updateQuota: PropTypes.func.isRequired,
  updateName: PropTypes.func.isRequired,
  updateMaxUserNumber: PropTypes.func.isRequired,
};

class Content extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isSetNameDialogOpen: false,
      isSetMaxUserNumberDialogOpen: false
    };
  }

  toggleSetNameDialog = () => {
    this.setState({isSetNameDialogOpen: !this.state.isSetNameDialogOpen});
  }

  toggleSetMaxUserNumberDialog = () => {
    this.setState({isSetMaxUserNumberDialogOpen: !this.state.isSetMaxUserNumberDialogOpen});
  }

  showEditIcon = (action) => {
    return (
      <span
        title={gettext('Edit')}
        className="dtable-font dtable-icon-rename attr-action-icon"
        onClick={action}>
      </span>
    );
  }

  render() {
    const { loading, errorMsg, orgInfo } = this.props;
    if (loading) {
      return <Loading />;
    } else if (errorMsg) {
      return <p className="error text-center">{errorMsg}</p>;
    } else {
      const { org_name, users_count, max_user_number, groups_count, storage_usage } = orgInfo;
      const { isSetNameDialogOpen, isSetMaxUserNumberDialogOpen } = this.state;
      return (
        <Fragment>
          <dl className="m-0">
            <dt className="info-item-heading">{gettext('Name')}</dt>
            <dd className="info-item-content">
              {org_name}
              {this.showEditIcon(this.toggleSetNameDialog)}
            </dd>

            <dt className="info-item-heading">{gettext('Number of members')}</dt>
            <dd className="info-item-content">{users_count}</dd>

            {max_user_number &&
              <Fragment>
                <dt className="info-item-heading">{gettext('Max number of members')}</dt>
                <dd className="info-item-content">
                  {max_user_number}
                  {this.showEditIcon(this.toggleSetMaxUserNumberDialog)}
                </dd>
              </Fragment>
            }

            <dt className="info-item-heading">{gettext('Number of groups')}</dt>
            <dd className="info-item-content">{groups_count}</dd>

            <dt className="info-item-heading">{gettext('Storage Usage')}</dt>
            <dd className="info-item-content">{Utils.bytesToSize(storage_usage)}</dd>

          </dl>
          {isSetNameDialogOpen &&
            <SysAdminSetOrgNameDialog
              name={org_name}
              updateName={this.props.updateName}
              toggle={this.toggleSetNameDialog}
            />
          }
          {isSetMaxUserNumberDialogOpen &&
            <SysAdminSetOrgMaxUserNumberDialog
              value={max_user_number}
              updateValue={this.props.updateMaxUserNumber}
              toggle={this.toggleSetMaxUserNumberDialog}
            />
          }
        </Fragment>
      );
    }
  }
}

Content.propTypes = contentPropTypes;

const orgInfoPropTypes = {
  orgID: PropTypes.string,
  onCloseSidePanel: PropTypes.func
};

class OrgInfo extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      errorMsg: '',
      orgInfo: {}
    };
  }

  componentDidMount () {
    dtableWebAPI.sysAdminGetOrg(this.props.orgID).then((res) => {
      this.setState({
        loading: false,
        orgInfo: res.data
      });
    }).catch((error) => {
      if (error.response) {
        if (error.response.status === 403) {
          this.setState({
            loading: false,
            errorMsg: gettext('Permission denied')
          }); 
          location.href = `${loginUrl}?next=${encodeURIComponent(location.href)}`;
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

  updateQuota = (quota) => {
    const data = {quota: quota};
    dtableWebAPI.sysAdminUpdateOrg(this.props.orgID, data).then(res => {
      const newOrgInfo = Object.assign(this.state.orgInfo, {
        quota: res.data.quota
      });
      this.setState({orgInfo: newOrgInfo});
      toaster.success(gettext('Successfully set quota.'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    }); 
  }

  updateName = (orgName) => {
    const data = {orgName: orgName};
    dtableWebAPI.sysAdminUpdateOrg(this.props.orgID, data).then(res => {
      const newOrgInfo = Object.assign(this.state.orgInfo, {
        org_name: res.data.org_name
      });
      this.setState({orgInfo: newOrgInfo});
      toaster.success(gettext('Successfully set name.'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  updateMaxUserNumber = (newValue) => {
    const data = {maxUserNumber: newValue};
    dtableWebAPI.sysAdminUpdateOrg(this.props.orgID, data).then(res => {
      const newOrgInfo = Object.assign(this.state.orgInfo, {
        max_user_number: res.data.max_user_number
      });
      this.setState({orgInfo: newOrgInfo});
      toaster.success(gettext('Successfully set max number of members.'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  render() {
    const { orgInfo } = this.state;
    return (
      <Fragment>
        <MainPanelTopbar onCloseSidePanel={this.props.onCloseSidePanel} />
        <div className="main-panel-center flex-row">
          <div className="cur-view-container">
            <OrgNav currentItem="info" orgID={this.props.orgID} orgName={orgInfo.org_name} />
            <div className="cur-view-content">
              <Content
                orgID={this.props.orgID}
                loading={this.state.loading}
                errorMsg={this.state.errorMsg}
                orgInfo={this.state.orgInfo}
                updateQuota={this.updateQuota}
                updateName={this.updateName}
                updateMaxUserNumber={this.updateMaxUserNumber}
              />
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

OrgInfo.propTypes = orgInfoPropTypes;

export default OrgInfo;
