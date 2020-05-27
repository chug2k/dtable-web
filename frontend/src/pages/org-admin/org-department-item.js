import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from '@reach/router';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import { Utils } from '../../utils/utils.js';
import toaster from '../../components/toast';
import MainPanelTopbar from './main-panel-topbar';
import ModalPortal from '../../components/modal-portal';
import RoleEditor from '../../components/select-editor/role-editor';
import AddDepartDialog from '../../components/dialog/org-add-department-dialog';
import AddMemberDialog from '../../components/dialog/org-add-member-dialog';
import DeleteMemberDialog from '../../components/dialog/org-delete-member-dialog';
import DeleteDepartDialog from '../../components/dialog/org-delete-department-dialog';
import SetGroupQuotaDialog from '../../components/dialog/org-set-group-quota-dialog';
import { serviceURL, siteRoot, gettext, orgID } from '../../utils/constants';
import '../../css/org-department-item.css';

class OrgDepartmentItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      groupName: '',
      isItemFreezed: false,
      ancestorGroups: [],
      members: [],
      deletedMember: {},
      isShowAddMemberDialog: false,
      showDeleteMemberDialog: false,
      groups: [],
      subGroupID: '',
      subGroupName: '',
      isShowAddDepartDialog: false,
      showDeleteDepartDialog: false,
      showSetGroupQuotaDialog: false,
    };
  }

  componentDidMount() {
    const groupID = this.props.groupID;
    this.listOrgMembers(groupID);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.groupID !== nextProps.groupID) {
      this.listOrgMembers(nextProps.groupID);
    }
  }

  listOrgMembers = (groupID) => {
    dtableWebAPI.orgAdminListGroupInfo(orgID, groupID, true).then(res => {
      this.setState({
        members: res.data.members,
        groups: res.data.groups,
        ancestorGroups: res.data.ancestor_groups,
        groupName: res.data.name,
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  listSubDepartGroups = (groupID) => {
    dtableWebAPI.orgAdminListGroupInfo(orgID, groupID, true).then(res => {
      this.setState({ groups: res.data.groups });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  toggleCancel = () => {
    this.setState({
      showDeleteMemberDialog: false,
      showDeleteDepartDialog: false,
      showSetGroupQuotaDialog: false,
    });
  }

  onSubDepartChanged = () => {
    this.listSubDepartGroups(this.props.groupID);
  }

  onMemberChanged = () => {
    this.listOrgMembers(this.props.groupID);
  }

  toggleItemFreezed = (isFreezed) => {
    this.setState({ isItemFreezed: isFreezed });
  }

  showDeleteMemberDialog = (member) => {
    this.setState({ showDeleteMemberDialog: true, deletedMember: member });
  }

  toggleAddMemberDialog = () => {
    this.setState({ isShowAddMemberDialog: !this.state.isShowAddMemberDialog });
  }

  toggleAddDepartDialog = () => {
    this.setState({ isShowAddDepartDialog: !this.state.isShowAddDepartDialog});
  }

  showDeleteDepartDialog = (subGroup) => {
    this.setState({ 
      showDeleteDepartDialog: true,
      subGroupID: subGroup.id,
      subGroupName: subGroup.name
    });
  }

  showSetGroupQuotaDialog = (subGroupID) => {
    this.setState({
      showSetGroupQuotaDialog: true,
      subGroupID: subGroupID
    });
  }

  render() {
    const { members, groups } = this.state;
    const groupID = this.props.groupID;
    const topBtn = 'btn btn-secondary operation-item';
    const topbarChildren = (
      <Fragment>
        {groupID &&
          <button className={topBtn} title={gettext('New Sub-department')} onClick={this.toggleAddDepartDialog}>{gettext('New Sub-department')}</button>
        }
        {groupID &&
          <button className={topBtn} title={gettext('Add Member')} onClick={this.toggleAddMemberDialog}>{gettext('Add Member')}</button>
        }
        {this.state.isShowAddMemberDialog && (
          <ModalPortal>
            <AddMemberDialog
              toggle={this.toggleAddMemberDialog}
              onMemberChanged={this.onMemberChanged}
              groupID={groupID}
            />
          </ModalPortal>
        )}
        {this.state.isShowAddDepartDialog && (
          <ModalPortal>
            <AddDepartDialog
              onDepartChanged={this.onSubDepartChanged}
              parentGroupID={groupID}
              toggle={this.toggleAddDepartDialog}
            />
          </ModalPortal>
        )}
      </Fragment>
    );

    return (
      <Fragment>
        <MainPanelTopbar children={topbarChildren} />
        <div className="main-panel-center flex-row h-100">
          <div className="cur-view-container o-auto">
            <div className="cur-view-path">
              <div className="fleft">
                <h3 className="sf-heading">
                  {groupID ? 
                    <Link to={siteRoot + 'org/departmentadmin/'}>{gettext('Departments')}</Link>
                    : <span>{gettext('Departments')}</span>
                  }
                  {this.state.ancestorGroups.map(ancestor => {
                    let newHref = siteRoot + 'org/departmentadmin/groups/' + ancestor.id + '/';
                    return <span key={ancestor.id}>{' / '}<Link to={newHref}>{ancestor.name}</Link></span>;
                  })}
                  {groupID && <span>{' / '}{this.state.groupName}</span>}
                </h3>
              </div>
            </div>

            <div className="cur-view-subcontainer org-groups">
              <div className="cur-view-path">
                <div className="fleft"><h3 className="sf-heading">{gettext('Sub-departments')}</h3></div>
              </div>
              <div className="cur-view-content">
                {groups && groups.length > 0 ?
                  <table>
                    <thead>
                      <tr>
                        <th width="40%">{gettext('Name')}</th>
                        <th width="25%">{gettext('Created At')}</th>
                        <th width="20%">{gettext('Quota')}</th>
                        <th width="15%"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group, index) => {
                        return(
                          <React.Fragment key={group.id}>
                            <GroupItem
                              group={group}
                              showDeleteDepartDialog={this.showDeleteDepartDialog}
                              showSetGroupQuotaDialog={this.showSetGroupQuotaDialog}
                            />
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                  : <p className="no-group">{gettext('No sub-departments')}</p>
                }
              </div>
            </div>
            
            <div className="cur-view-subcontainer org-members">
              <div className="cur-view-path">
                <div className="fleft"><h3 className="sf-heading">{gettext('Members')}</h3></div>
              </div>
              <div className="cur-view-content">
                {(members && members.length === 1 && members[0].role === 'Owner') ?
                  <p className="no-member">{gettext('No members')}</p> :
                  <table>
                    <thead>
                      <tr>
                        <th width="5%"></th>
                        <th width="50%">{gettext('Name')}</th>
                        <th width="15%">{gettext('Role')}</th>
                        <th width="30%"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member, index) => {
                        return (
                          <React.Fragment key={index}>
                            <MemberItem
                              member={member}
                              showDeleteMemberDialog={this.showDeleteMemberDialog}
                              isItemFreezed={this.state.isItemFreezed}
                              onMemberChanged={this.onMemberChanged}
                              toggleItemFreezed={this.toggleItemFreezed}
                              groupID={groupID}
                            />
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                }
              </div>
            </div>

          </div>
          <React.Fragment>
            {this.state.showDeleteMemberDialog && (
              <ModalPortal>
                <DeleteMemberDialog
                  toggle={this.toggleCancel}
                  onMemberChanged={this.onMemberChanged}
                  member={this.state.deletedMember}
                  groupID={groupID}
                />
              </ModalPortal>
            )}
            {this.state.showDeleteDepartDialog && (
              <ModalPortal>
                <DeleteDepartDialog
                  toggle={this.toggleCancel}
                  groupID={this.state.subGroupID}
                  groupName={this.state.subGroupName}
                  onDepartChanged={this.onSubDepartChanged}
                />
              </ModalPortal>
            )}
            {this.state.showSetGroupQuotaDialog && (
              <ModalPortal>
                <SetGroupQuotaDialog
                  toggle={this.toggleCancel}
                  groupID={this.state.subGroupID}
                  onDepartChanged={this.onSubDepartChanged}
                />
              </ModalPortal>
            )}
          </React.Fragment>
        </div>
      </Fragment>
    );
  }
}

class MemberItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      highlight: false,
      showRoleMenu: false,
    };
    this.roles = ['Admin', 'Member'];
  }

  onMouseEnter = () => {
    if (this.props.isItemFreezed) return;
    this.setState({ highlight: true });
  }

  onMouseLeave = () => {
    if (this.props.isItemFreezed) return;
    this.setState({ highlight: false });
  }

  toggleMemberRoleMenu = () => {
    this.setState({ showRoleMenu: !this.state.showRoleMenu });
  }

  onChangeUserRole = (role) => {
    let isAdmin = role === 'Admin' ? true : false;
    dtableWebAPI.orgAdminSetGroupMemberRole(orgID, this.props.groupID, this.props.member.email, isAdmin).then((res) => {
      this.props.onMemberChanged();
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
    this.setState({
      highlight: false,
    });
  }

  render() {
    const member = this.props.member;
    const highlight = this.state.highlight;
    let memberLink = serviceURL + '/org/useradmin/info/' + member.email + '/';
    if (member.role === 'Owner') return null;
    return (
      <tr className={highlight ? 'tr-highlight' : ''} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <td><img src={member.avatar_url} alt="member-header" width="24" className="avatar"/></td>
        <td><a href={memberLink}>{member.name}</a></td>
        <td>
          <RoleEditor 
            isTextMode={true}
            isEditIconShow={highlight}
            currentRole={member.role}
            roles={this.roles}
            onRoleChanged={this.onChangeUserRole}
            toggleItemFreezed={this.props.toggleItemFreezed}
          />
        </td>
        {!this.props.isItemFreezed ?
          <td className="cursor-pointer text-center" onClick={this.props.showDeleteMemberDialog.bind(this, member)}>
            <span className={`dtable-font dtable-icon-x action-icon ${highlight ? '' : 'vh'}`} title="Delete"></span>
          </td> : <td></td>
        }
      </tr>
    );
  }
}

const MemberItemPropTypes = {
  groupID: PropTypes.string.isRequired,
  member: PropTypes.object.isRequired,
  isItemFreezed: PropTypes.bool.isRequired,
  onMemberChanged: PropTypes.func.isRequired,
  showDeleteMemberDialog: PropTypes.func.isRequired,
  toggleItemFreezed: PropTypes.func.isRequired,
};

MemberItem.propTypes = MemberItemPropTypes;

class GroupItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      highlight: false,
    };
  }

  onMouseEnter = () => {
    this.setState({ highlight: true });
  }

  onMouseLeave = () => {
    this.setState({ highlight: false });
  }

  render() {
    const group = this.props.group;
    const highlight = this.state.highlight;
    const newHref = siteRoot+ 'org/departmentadmin/groups/' + group.id + '/';
    return (
      <tr className={highlight ? 'tr-highlight' : ''} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <td><Link to={newHref}>{group.name}</Link></td>
        <td>{moment(group.created_at).fromNow()}</td>
        <td onClick={this.props.showSetGroupQuotaDialog.bind(this, group.id)}>
          {Utils.bytesToSize(group.quota)}{' '}
          <span title="Edit Quota" className={`dtable-font dtable-icon-rename attr-action-icon ${highlight ? '' : 'vh'}`}></span>
        </td>
        <td className="cursor-pointer text-center" onClick={this.props.showDeleteDepartDialog.bind(this, group)}>
          <span className={`dtable-font dtable-icon-x action-icon ${highlight ? '' : 'vh'}`} title="Delete"></span>
        </td>
      </tr>
    );
  }
}

const GroupItemPropTypes = {
  group: PropTypes.object.isRequired,
  groupID: PropTypes.string,
  showSetGroupQuotaDialog: PropTypes.func.isRequired,
  showDeleteDepartDialog: PropTypes.func.isRequired,
  isSubdepartChanged: PropTypes.bool,
};

GroupItem.propTypes = GroupItemPropTypes;


const OrgDepartmentItemPropTypes = {
  groupID: PropTypes.string,
};

OrgDepartmentItem.propTypes = OrgDepartmentItemPropTypes;

export default OrgDepartmentItem;