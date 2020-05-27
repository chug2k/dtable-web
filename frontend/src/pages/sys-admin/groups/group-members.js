import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { Utils } from '../../../utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { loginUrl, gettext } from '../../../utils/constants';
import toaster from '../../../components/toast';
import EmptyTip from '../../../components/empty-tip';
import Loading from '../../../components/loading';
import CommonOperationConfirmationDialog from '../../../components/dialog/common-operation-confirmation-dialog';
import SysAdminGroupAddMemberDialog from '../../../components/dialog/sysadmin-dialog/sysadmin-group-add-member-dialog';
import SysAdminGroupRoleEditor from '../../../components/select-editor/sysadmin-group-role-editor';
import MainPanelTopbar from '../main-panel-topbar';
import GroupNav from './group-nav';
import UserLink from '../user-link';

const contentPropTypes = {
  loading: PropTypes.bool.isRequired,
  errorMsg: PropTypes.string,
  items: PropTypes.array,
  removeMember: PropTypes.func,
  updateMemberRole: PropTypes.func,
};

class Content extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { loading, errorMsg, items } = this.props;
    if (loading) {
      return <Loading />;
    } else if (errorMsg) {
      return <p className="error text-center mt-4">{errorMsg}</p>;
    } else {
      const emptyTip = (
        <EmptyTip>
          <h2>{gettext('No members')}</h2>
        </EmptyTip>
      );
      const table = (
        <Fragment>
          <table className="table-hover">
            <thead>
              <tr>
                <th width="5%">{/* icon */}</th>
                <th width="55%">{gettext('Name')}</th>
                <th width="30%">{gettext('Role')}</th>
                <th width="10%">{/*Operations*/}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                return (<Item
                  key={index}
                  item={item}
                  removeMember={this.props.removeMember}
                  updateMemberRole={this.props.updateMemberRole}
                />);
              })}
            </tbody>
          </table>
        </Fragment>
      );
      return items.length ? table : emptyTip; 
    }
  }
}

Content.propTypes = contentPropTypes;

const itemPorpTypes = {
  item: PropTypes.object,
  removeMember: PropTypes.func,
  updateMemberRole: PropTypes.func
};

class Item extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isOpIconShown: false,
      isDeleteDialogOpen: false
    };
  }

  handleMouseEnter = () => {
    this.setState({isOpIconShown: true});
  }

  handleMouseLeave = () => {
    this.setState({isOpIconShown: false});
  }

  toggleDeleteDialog = (e) => {
    if (e) {
      e.preventDefault();
    }
    this.setState({isDeleteDialogOpen: !this.state.isDeleteDialogOpen});
  }

  removeMember = () => {
    const { item } = this.props;
    this.props.removeMember(item.email, item.name);
    this.toggleDeleteDialog();
  }

  updateMemberRole = (role) => {
    this.props.updateMemberRole(this.props.item.email, role);
  }

  render() {
    let { isOpIconShown, isDeleteDialogOpen } = this.state;
    let { item } = this.props;

    let itemName = '<span class="op-target">' + Utils.HTMLescape(item.name) + '</span>';
    let dialogMsg = gettext('Are you sure you want to remove {placeholder} ?').replace('{placeholder}', itemName);
    return (
      <Fragment>
        <tr onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <td><img src={item.avatar_url} alt="" className="rounded-circle" width="24" /></td>
          <td><UserLink email={item.email} name={item.name} /></td>
          <td>
            {item.role === 'Owner' ?
              gettext('Owner') :
              <SysAdminGroupRoleEditor 
                isTextMode={true}
                isEditIconShow={isOpIconShown}
                roleOptions={['Member', 'Admin']}
                currentRole={item.role}
                onRoleChanged={this.updateMemberRole}
              />
            }
          </td>
          <td>
            {item.role !== 'Owner' &&
            <span className={`dtable-font dtable-icon-x action-icon ${isOpIconShown ? '' : 'invisible'}`} title={gettext('Remove')} onClick={this.toggleDeleteDialog}></span>
            }
          </td>
        </tr>
        {isDeleteDialogOpen &&
          <CommonOperationConfirmationDialog 
            title={gettext('Remove Member')}
            message={dialogMsg}
            executeOperation={this.removeMember}
            confirmBtnText={gettext('Remove')}
            toggleDialog={this.toggleDeleteDialog}
          />
        }
      </Fragment>
    );
  }
}

Item.propTypes = itemPorpTypes;

const groupMembersPropTypes = {
  groupID: PropTypes.string,
  onCloseSidePanel: PropTypes.func
};

class GroupMembers extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      errorMsg: '',
      groupName: '',
      memberList: [],
      isAddMemberDialogOpen: false
    };
  }

  componentDidMount () {
    dtableWebAPI.sysAdminListGroupMembers(this.props.groupID).then((res) => {
      this.setState({
        loading: false,
        memberList: res.data.members,
        groupName: res.data.group_name
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

  toggleAddMemgerDialog = () => {
    this.setState({isAddMemberDialogOpen: !this.state.isAddMemberDialogOpen});
  }

  addMembers = (emails) => {
    dtableWebAPI.sysAdminAddGroupMember(this.props.groupID, emails).then(res => {
      let newMemberList = res.data.success;
      if (newMemberList.length) {
        newMemberList.map(item => {
          const msg = gettext('Successfully added {email_placeholder}')
            .replace('{email_placeholder}', item.email);
          toaster.success(msg);
          return item;
        });
        newMemberList = newMemberList.concat(this.state.memberList);
        this.setState({
          memberList: newMemberList
        });
      }
      res.data.failed.map(item => {
        const msg = gettext('Failed to add {email_placeholder}: {error_msg_placeholder}')
          .replace('{email_placeholder}', item.email)
          .replace('{error_msg_placeholder}', item.error_msg);
        toaster.danger(msg, {duration: 3});
        return item;
      });
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  removeMember = (email, name) => {
    dtableWebAPI.sysAdminDeleteGroupMember(this.props.groupID, email).then(res => {
      let newRepoList = this.state.memberList.filter(item => {
        return item.email !== email;
      });
      this.setState({
        memberList: newRepoList
      });
      toaster.success(gettext('Successfully removed {placeholder}.').replace('{placeholder}', name));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  updateMemberRole = (email, role) => {
    let isAdmin = role === 'Admin';
    dtableWebAPI.sysAdminUpdateGroupMemberRole(this.props.groupID, email, isAdmin).then(res => {
      let newRepoList = this.state.memberList.map(item => {
        if (item.email === email) {
          item.role = role;
        }
        return item;
      });
      this.setState({
        memberList: newRepoList
      });
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  render() {
    let { isAddMemberDialogOpen } = this.state;
    const isDesktop = Utils.isDesktop();
    let MainPanelTopbarContainer;
    if (isDesktop) {
      MainPanelTopbarContainer = <MainPanelTopbar>
        <Button className="btn btn-secondary operation-item" onClick={this.toggleAddMemgerDialog}>{gettext('Add Member')}</Button>
      </MainPanelTopbar>;
    } else {
      MainPanelTopbarContainer = <MainPanelTopbar onCloseSidePanel={this.props.onCloseSidePanel}>
        <span className="mobile-dropdown-item dropdown-item" onClick={this.toggleAddMemgerDialog}>{gettext('Add Member')}</span>
      </MainPanelTopbar>;
    }
    return (
      <Fragment>
        {MainPanelTopbarContainer}
        <div className="main-panel-center flex-row">
          <div className="cur-view-container">
            <GroupNav 
              currentItem="members"
              groupID={this.props.groupID}
              groupName={this.state.groupName}
            />
            <div className="cur-view-content">
              <Content
                loading={this.state.loading}
                errorMsg={this.state.errorMsg}
                items={this.state.memberList}
                removeMember={this.removeMember}
                updateMemberRole={this.updateMemberRole}
              />
            </div>
          </div>
        </div>
        {isAddMemberDialogOpen &&
          <SysAdminGroupAddMemberDialog
            addMembers={this.addMembers}
            toggle={this.toggleAddMemgerDialog}
          />
        }
      </Fragment>
    );
  }
}

GroupMembers.propTypes = groupMembersPropTypes;

export default GroupMembers;
