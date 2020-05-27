import React, { Component, Fragment } from 'react';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import { gettext, orgMemberQuotaEnabled} from '../../utils/constants';
import { Utils } from '../../utils/utils';
import MainPanelTopbar from './main-panel-topbar';
import OrgAdminSetOrgNameDialog from '../../components/dialog/orgadmin-diglog/sysadmin-set-org-name-dialog';
import toaster from '../../components/toast';

class OrgInfo extends Component {

  constructor(props) {
    super(props);
    this.state = {
      storage_quota: 0,
      storage_usage: 0,
      member_quota: 0,
      member_usage: 0,
      active_members: 0,
      org_name: '',
      isSetNameDialogOpen: false
    };
  }

  componentDidMount() {
    dtableWebAPI.orgAdminGetOrgInfo().then(res => {
      this.setState({
        storage_quota: res.data.storage_quota,
        storage_usage: res.data.storage_usage,
        member_quota: res.data.member_quota,
        member_usage: res.data.member_usage,
        active_members: res.data.active_members,
        org_name: res.data.org_name
      });
    });
  }

  updateName = (newName) => {
    dtableWebAPI.orgAdminUpdateOrgInfo(newName).then((res) => {
      this.setState({ 'org_name' : newName });
      toaster.success(gettext('Successfully set name.'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  toggleSetNameDialog = () => {
    this.setState({isSetNameDialogOpen: !this.state.isSetNameDialogOpen});
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
    let { org_name, isSetNameDialogOpen } = this.state;
    return (
      <Fragment>
        <MainPanelTopbar/>
        <div className="main-panel-center flex-row">
          <div className="cur-view-container">
            <div className="cur-view-path">
              <h3 className="sf-heading">{gettext('Info')}</h3>
            </div>
            <div className="cur-view-content">
              <dl>
                <dt className="info-item-heading">{gettext('Name')}</dt>
                <dd className="info-item-content">
                  {this.state.org_name}
                  {this.showEditIcon(this.toggleSetNameDialog)}
                </dd>
                <dt>{gettext('Space Used')} / {gettext('Space Limit')}</dt>
                <dd>{Utils.bytesToSize(this.state.storage_usage)} / {this.state.storage_quota ? Utils.bytesToSize(this.state.storage_quota) : '--'}</dd>

                {orgMemberQuotaEnabled ? <dt>{gettext('Active Users')} / {gettext('Total Users')} / {gettext('Limits')}</dt> : <dt>{gettext('Active Users')} / {gettext('Total Users')}</dt>}

                {orgMemberQuotaEnabled ? <dd>{(this.state.active_members > 0) ? this.state.active_members : '--'} / {(this.state.member_usage > 0) ? this.state.member_usage : '--'} / {(this.state.member_quota > 0) ? this.state.member_quota : '--'}</dd> : <dd>{this.state.active_members > 0 ? this.state.active_members : '--'} / {this.state.member_usage > 0 ? this.state.member_usage : '--'}</dd>}

              </dl>
              {isSetNameDialogOpen &&
                <OrgAdminSetOrgNameDialog
                  name={org_name}
                  updateName={this.updateName}
                  toggle={this.toggleSetNameDialog}
                />
              }
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default OrgInfo;
