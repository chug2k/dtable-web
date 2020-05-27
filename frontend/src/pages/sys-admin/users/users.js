import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link, navigate } from '@reach/router';
import { Button } from 'reactstrap';
import moment from 'moment';
import { Utils } from '../../../utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { isPro, username, gettext, multiInstitution, siteRoot, loginUrl } from '../../../utils/constants';
import toaster from '../../../components/toast';
import EmptyTip from '../../../components/empty-tip';
import Loading from '../../../components/loading';
import Paginator from '../../../components/paginator';
import SysAdminUserStatusEditor from '../../../components/select-editor/sysadmin-user-status-editor';
import SysAdminUserRoleEditor from '../../../components/select-editor/sysadmin-user-role-editor';
import SelectEditor from '../../../components/select-editor/select-editor';
import SysAdminUserSetQuotaDialog from '../../../components/dialog/sysadmin-dialog/set-quota';
import SysAdminImportUserDialog from '../../../components/dialog/sysadmin-dialog/sysadmin-import-user-dialog';
import SysAdminAddUserDialog from '../../../components/dialog/sysadmin-dialog/sysadmin-add-user-dialog';
import SysAdminBatchAddAdminDialog from '../../../components/dialog/sysadmin-dialog/sysadmin-batch-add-admin-dialog';
import CommonOperationConfirmationDialog from '../../../components/dialog/common-operation-confirmation-dialog';
import SysAdminUser from '../../../models/sysadmin-user';
import SysAdminAdminUser from '../../../models/sysadmin-admin-user';
import MainPanelTopbar from '../main-panel-topbar';
import UsersNav from './users-nav';
import OpMenu from './user-op-menu';
import Search from '../search';

const { availableRoles, availableAdminRoles, institutions } = window.sysadmin.pageOptions;

const contentPropTypes = {
  isAdmin: PropTypes.bool,
  isLDAPImported: PropTypes.bool,
  loading: PropTypes.bool.isRequired,
  isAllUsersSelected: PropTypes.bool,
  errorMsg: PropTypes.string,
  items: PropTypes.array,
  currentPage: PropTypes.number.isRequired,
  hasNextPage: PropTypes.bool.isRequired,
  curPerPage: PropTypes.number.isRequired,
  resetPerPage: PropTypes.func.isRequired,
  getListByPage: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
  deleteUser: PropTypes.func.isRequired,
  updateAdminRole: PropTypes.func.isRequired,
  revokeAdmin: PropTypes.func.isRequired,
  onUserSelected: PropTypes.func.isRequired,
  toggleSelectAllUsers: PropTypes.func.isRequired,
};

class Content extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isItemFreezed: false
    };
  }

  onFreezedItem = () => {
    this.setState({isItemFreezed: true});
  }

  onUnfreezedItem = () => {
    this.setState({isItemFreezed: false});
  }

  getPreviousPage = () => {
    this.props.getListByPage(this.props.currentPage - 1);
  }

  getNextPage = () => {
    this.props.getListByPage(this.props.currentPage + 1);
  }

  render() {
    const { isAdmin, loading, errorMsg, items, isAllUsersSelected, curPerPage, hasNextPage, currentPage } = this.props;
    if (loading) {
      return <Loading />;
    } else if (errorMsg) {
      return <p className="error text-center mt-4">{errorMsg}</p>;
    } else {
      const emptyTip = (
        <EmptyTip>
          <h2>{gettext('No users')}</h2>
        </EmptyTip>
      );

      let columns = [];
      const colNameText = `${gettext('Name')} / ${gettext('Contact Email')}`;
      const colCreatedText = `${gettext('Created At')} / ${gettext('Last Login')}`;
      if (isPro) {
        columns.push(
          {width: '20%', text: colNameText},
          {width: '10%', text: gettext('Status')},
          {width: '10%', text: gettext('Role')}
        );
      } else {
        columns.push(
          {width: '25%', text: colNameText},
          {width: '15%', text: gettext('Status')}
        );
      }
      if (multiInstitution && !isAdmin) {
        columns.push(
          {width: '10%', text: gettext('Storage Used')},
          {width: '9%', text: gettext('Institution')},
          {width: '14%', text: colCreatedText},
          {width: '5%', text: ''}
        );
      } else {
        columns.push(
          {width: '10%', text: gettext('Storage Used')},
          {width: '17%', text: colCreatedText},
          {width: '5%', text: ''}
        );
      }

      const table = (
        <Fragment>
          <table>
            <thead>
              <tr>
                <th width="3%" className="pl-2">
                  <input type="checkbox" className="vam" onChange={this.props.toggleSelectAllUsers} checked={isAllUsersSelected} />
                </th>
                {columns.map((item, index) => {
                  return <th width={item.width} key={index}>{item.text}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                return (<Item
                  key={index}
                  item={item}
                  isItemFreezed={this.state.isItemFreezed}
                  onFreezedItem={this.onFreezedItem}
                  onUnfreezedItem={this.onUnfreezedItem}
                  updateUser={this.props.updateUser}
                  deleteUser={this.props.deleteUser}
                  updateAdminRole={this.props.updateAdminRole}
                  revokeAdmin={this.props.revokeAdmin}
                  onUserSelected={this.props.onUserSelected}
                  isAdmin={this.props.isAdmin}
                  isLDAPImported={this.props.isLDAPImported}
                />);
              })}
            </tbody>
          </table>
          {!this.props.isAdmin &&
          <Paginator
            gotoPreviousPage={this.getPreviousPage}
            gotoNextPage={this.getNextPage}
            currentPage={currentPage}
            hasNextPage={hasNextPage}
            curPerPage={curPerPage}
            resetPerPage={this.props.resetPerPage}
          />
          }
        </Fragment>
      );

      return items.length ? table : emptyTip; 
    }
  }
}

Content.propTypes = contentPropTypes;

const itemPropTypes = {
  isAdmin: PropTypes.bool,
  isLDAPImported: PropTypes.bool,
  item: PropTypes.object.isRequired,
  isItemFreezed: PropTypes.bool.isRequired,
  onFreezedItem: PropTypes.func.isRequired,
  onUnfreezedItem: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
  deleteUser: PropTypes.func.isRequired,
  updateAdminRole: PropTypes.func.isRequired,
  revokeAdmin: PropTypes.func.isRequired,
  onUserSelected: PropTypes.func.isRequired,
};

class Item extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isOpIconShown: false,
      highlight: false,
      isSetQuotaDialogOpen: false,
      isDeleteUserDialogOpen: false,
      isResetUserPasswordDialogOpen: false,
      isRevokeAdminDialogOpen: false
    };
  }

  handleMouseEnter = () => {
    if (!this.props.isItemFreezed) {
      this.setState({
        isOpIconShown: true,
        highlight: true
      });
    }
  }

  handleMouseLeave = () => {
    if (!this.props.isItemFreezed) {
      this.setState({
        isOpIconShown: false,
        highlight: false
      });
    } 
  }

  onUnfreezedItem = () => {
    this.setState({
      highlight: false,
      isOpIconShow: false
    });
    this.props.onUnfreezedItem();
  }

  toggleSetQuotaDialog = () => {
    this.setState({isSetQuotaDialogOpen: !this.state.isSetQuotaDialogOpen});
  }

  toggleDeleteUserDialog = () => {
    this.setState({isDeleteUserDialogOpen: !this.state.isDeleteUserDialogOpen});
  }

  toggleResetUserPasswordDialog = () => {
    this.setState({isResetUserPasswordDialogOpen: !this.state.isResetUserPasswordDialogOpen});
  }

  toggleRevokeAdminDialog = () => {
    this.setState({isRevokeAdminDialogOpen: !this.state.isRevokeAdminDialogOpen});
  }

  onUserSelected = () => {
    this.props.onUserSelected(this.props.item);
  }

  updateStatus= (value) => {
    const isActive = value === 'active';
    if (isActive) {
      toaster.notify(gettext('It may take some time, please wait.'));
    }
    this.props.updateUser(this.props.item.email, 'is_active', isActive);
  }

  updateRole = (value) => {
    this.props.updateUser(this.props.item.email, 'role', value);
  }

  updateAdminRole = (value) => {
    this.props.updateAdminRole(this.props.item.email, value);
  }

  translateAdminRole = (role) => {
    switch (role) {
      case 'default_admin':
        return gettext('Default Admin');
      case 'system_admin':
        return gettext('System Admin');
      case 'daily_admin':
        return gettext('Daily Admin');
      case 'audit_admin':
        return gettext('Audit Admin');
      default:
        return role;
    }   
  }

  updateInstitution = (value) => {
    this.props.updateUser(this.props.item.email, 'institution', value);
  }

  translateInstitution = (inst) => {
    return inst;
  }

  updateQuota = (value) => {
    this.props.updateUser(this.props.item.email, 'quota_total', value);
  }

  deleteUser = () => {
    this.props.deleteUser(this.props.item.email);
  }

  resetPassword = () => {
    dtableWebAPI.sysAdminResetUserPassword(this.props.item.email).then(res => {
      toaster.success(res.data.reset_tip);
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    }); 
  }

  revokeAdmin = () => {
    const { item } = this.props;
    this.props.revokeAdmin(item.email, item.name);
  }

  getMenuOperations = () => {
    const { isAdmin, isLDAPImported } = this.props;
    let list = ['Delete'];
    if (!isLDAPImported) {
      list.push('Reset Password');
    }
    if (isAdmin) {
      list = ['Revoke Admin'];
    }
    return list;
  }

  translateOperations = (item) => {
    let translateResult = ''; 
    switch (item) {
      case 'Delete':
        translateResult = gettext('Delete');
        break;
      case 'Reset Password':
        translateResult = gettext('Reset Password');
        break;
      case 'Revoke Admin':
        translateResult = gettext('Revoke Admin');
        break;
      default:
        break;
    }   

    return translateResult;
  }

  onMenuItemClick = (operation) => {
    switch(operation) {
      case 'Delete':
        this.toggleDeleteUserDialog();
        break;
      case 'Reset Password':
        this.toggleResetUserPasswordDialog();
        break;
      case 'Revoke Admin':
        this.toggleRevokeAdminDialog();
        break;
      default:
        break;
    }
  }

  render() {
    const { item, isAdmin } = this.props;
    const { 
      isOpIconShown, 
      isSetQuotaDialogOpen,
      isDeleteUserDialogOpen,
      isResetUserPasswordDialogOpen,
      isRevokeAdminDialogOpen,
    } = this.state;

    const itemName = '<span class="op-target">' + Utils.HTMLescape(item.name) + '</span>';
    const deleteDialogMsg = gettext('Are you sure you want to delete {placeholder} ?').replace('{placeholder}', itemName);
    const resetPasswordDialogMsg = gettext('Are you sure you want to reset the password of {placeholder} ?').replace('{placeholder}', itemName);
    const revokeAdminDialogMsg = gettext('Are you sure you want to revoke the admin permission of {placeholder} ?').replace('{placeholder}', itemName);

    return (
      <Fragment>
        <tr className={this.state.highlight ? 'tr-highlight' : ''} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <td className="pl-2">
            <input type="checkbox" className="vam" onChange={this.onUserSelected} checked={item.isSelected || ''} />
          </td>
          <td>
            <Link to={`${siteRoot}sys/users/${encodeURIComponent(item.email)}/`}>{item.name}</Link>
            {item.contact_email && 
              <Fragment>
                <br />
                {item.contact_email}
              </Fragment>}
            {item.org_id && 
              <Fragment>
                <br />
                <Link to={`${siteRoot}sys/organizations/${item.org_id}/info/`}>({item.org_name})</Link>
              </Fragment>
            }
          </td>
          <td>
            <SysAdminUserStatusEditor 
              isTextMode={true}
              isEditIconShow={isOpIconShown}
              currentStatus={item.is_active ? 'active' : 'inactive'}
              statusOptions={['active', 'inactive']}
              onStatusChanged={this.updateStatus}
            />
          </td>
          {isPro && 
          <td>
            {isAdmin ?
              <SelectEditor
                isTextMode={true}
                isEditIconShow={isOpIconShown}
                options={availableAdminRoles}
                currentOption={item.admin_role}
                onOptionChanged={this.updateAdminRole}
                translateOption={this.translateAdminRole}
              /> :
              <SysAdminUserRoleEditor
                isTextMode={true}
                isEditIconShow={isOpIconShown}
                currentRole={item.role}
                roleOptions={availableRoles}
                onRoleChanged={this.updateRole}
              />
            }
          </td>
          }
          {(multiInstitution && !isAdmin) &&
            <td>
              <SelectEditor
                isTextMode={true}
                isEditIconShow={isOpIconShown && institutions.length > 0}
                options={institutions}
                currentOption={item.institution}
                onOptionChanged={this.updateInstitution}
                translateOption={this.translateInstitution}
              />
            </td>
          }
          <td>{item.storage_usage > 0 ? Utils.bytesToSize(item.storage_usage) : '--'}</td>
          <td>
            {`${item.create_time ? moment(item.create_time).format('YYYY-MM-DD HH:mm') : '--'} /`}
            <br />
            {`${item.last_login ? moment(item.last_login).fromNow() : '--'}`}
          </td>
          <td>
            {(item.email !== username && isOpIconShown) &&
            <OpMenu
              operations={this.getMenuOperations()}
              translateOperations={this.translateOperations}
              onMenuItemClick={this.onMenuItemClick}
              onFreezedItem={this.props.onFreezedItem}
              onUnfreezedItem={this.onUnfreezedItem}
            />
            }
          </td>
        </tr>
        {isSetQuotaDialogOpen &&
          <SysAdminUserSetQuotaDialog
            toggle={this.toggleSetQuotaDialog}
            updateQuota={this.updateQuota}
          />
        }
        {isDeleteUserDialogOpen &&
          <CommonOperationConfirmationDialog
            title={gettext('Delete User')}
            message={deleteDialogMsg}
            executeOperation={this.deleteUser}
            confirmBtnText={gettext('Delete')}
            toggleDialog={this.toggleDeleteUserDialog}
          />
        }
        {isResetUserPasswordDialogOpen &&
          <CommonOperationConfirmationDialog
            title={gettext('Reset Password')}
            message={resetPasswordDialogMsg}
            executeOperation={this.resetPassword}
            confirmBtnText={gettext('Reset')}
            toggleDialog={this.toggleResetUserPasswordDialog}
          /> 
        }
        {isRevokeAdminDialogOpen &&
          <CommonOperationConfirmationDialog
            title={gettext('Revoke Admin')}
            message={revokeAdminDialogMsg}
            executeOperation={this.revokeAdmin}
            confirmBtnText={gettext('Revoke')}
            toggleDialog={this.toggleRevokeAdminDialog}
          /> 
        }
      </Fragment>
    );
  }
}

Item.propTypes = itemPropTypes;

const userAllPropTypes = {
  isAdmin: PropTypes.bool,
  isLDAPImported: PropTypes.bool,
  onCloseSidePanel: PropTypes.func,
};

class UsersAll extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      errorMsg: '',
      userList: [],
      totalItemCount: 0,
      hasNextPage: false,
      currentPage: 1,
      perPage: 25,
      hasUserSelected: false,
      selectedUserList: [],
      isAllUsersSelected: false,
      isImportUserDialogOpen: false,
      isAddUserDialogOpen: false,
      isBatchSetQuotaDialogOpen: false,
      isBatchDeleteUserDialogOpen: false,
      isBatchAddAdminDialogOpen: false
    };
  }

  componentDidMount () {
    if (this.props.isAdmin) { // 'Admin' page
      this.getUserList(); // no pagination
    } else {
      let urlParams = (new URL(window.location)).searchParams;
      const { currentPage, perPage } = this.state;
      this.setState({
        perPage: parseInt(urlParams.get('per_page') || perPage),
        currentPage: parseInt(urlParams.get('page') || currentPage)
      }, () => {
        this.getUsersListByPage(this.state.currentPage);
      });
    }
  }

  toggleImportUserDialog = () => {
    this.setState({isImportUserDialogOpen: !this.state.isImportUserDialogOpen});
  }

  toggleAddUserDialog = () => {
    this.setState({isAddUserDialogOpen: !this.state.isAddUserDialogOpen});
  }

  toggleBatchSetQuotaDialog = () => {
    this.setState({isBatchSetQuotaDialogOpen: !this.state.isBatchSetQuotaDialogOpen});
  }

  toggleBatchDeleteUserDialog = () => {
    this.setState({isBatchDeleteUserDialogOpen: !this.state.isBatchDeleteUserDialogOpen});
  }

  onUserSelected = (item) => {
    let hasUserSelected = false;
    let selectedUserList = [];
    // traverse all users, toggle its selected status
    let users = this.state.userList.map(user => {
      // toggle status
      if (user.email === item.email) {
        user.isSelected = !user.isSelected;
      }
      // update selectedUserList
      // if current user is now selected, push it to selectedUserList
      // if current user is now not selected, drop it from selectedUserList
      if (user.isSelected === true) {
        hasUserSelected = true;
        selectedUserList.push(user);
      } else {
        selectedUserList = selectedUserList.filter(thisuser => {
          return thisuser.email !== user.email;
        });
      }
      return user;
    });
    // finally update state
    this.setState({
      userList: users,
      hasUserSelected: hasUserSelected,
      selectedUserList: selectedUserList,
    });
  }

  toggleSelectAllUsers = () => {
    if (this.state.isAllUsersSelected) {
      // if previous state is allSelected, toggle to not select
      let users = this.state.userList.map(user => {
        user.isSelected = false;
        return user;
      });
      this.setState({
        userList: users,
        hasUserSelected: false,
        isAllUsersSelected: false,
        selectedUserList: [],
      });
    } else {
      // if previous state is not allSelected, toggle to selectAll
      let users = this.state.userList.map(user => {
        user.isSelected = true;
        return user;
      });
      this.setState({
        userList: users,
        hasUserSelected: true,
        isAllUsersSelected: true,
        selectedUserList: users
      });
    }
  }

  getUserList = () => {
  // get admins
    dtableWebAPI.sysAdminListAdmins().then(res => {
      let users = res.data.admin_user_list.map(user => {
        return new SysAdminAdminUser(user);
      });
      this.setState({
        userList: users,
        loading: false
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

  getUsersListByPage = (page) => {
    let { perPage } = this.state;
    dtableWebAPI.sysAdminListUsers(page, perPage, this.props.isLDAPImported).then(res => {
      let users = res.data.data.map(user => {return new SysAdminUser(user);});
      this.setState({
        userList: users,
        loading: false,
        hasNextPage: Utils.hasNextPage(page, perPage, res.data.total_count),
        currentPage: page
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

  deleteUser = (email) => {
    dtableWebAPI.sysAdminDeleteUser(email).then(res => {
      let newUserList = this.state.userList.filter(item => {
        return item.email !== email;
      });
      this.setState({userList: newUserList});
      toaster.success(gettext('Successfully deleted 1 user.'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  setUserQuotaInBatch = (quotaTotal) => {
    let emails = this.state.selectedUserList.map(user => {
      return user.email;
    });
    dtableWebAPI.sysAdminSetUserQuotaInBatch(emails, quotaTotal).then(res => {
      let userList = this.state.userList.map(item => {
        res.data.success.map(resultUser => {
          if (item.email === resultUser.email) {
            item.quota_total = resultUser.quota_total;
          }
          return resultUser;
        });
        return item;
      });
      this.setState({userList: userList});
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  deleteUserInBatch = () => {
    let emails = this.state.selectedUserList.map(user => {
      return user.email;
    });
    dtableWebAPI.sysAdminDeleteUserInBatch(emails).then(res => {
      if (res.data.success.length) {
        let oldUserList = this.state.userList;
        let newUserList = oldUserList.filter(oldUser => {
          return !res.data.success.some(deletedUser =>{
            return deletedUser.email === oldUser.email;
          });
        });
        this.setState({
          userList: newUserList,
          hasUserSelected: emails.length !== res.data.success.length
        });
        const length = res.data.success.length;
        const msg = length === 1 ?
          gettext('Successfully deleted 1 user.') :
          gettext('Successfully deleted {user_number_placeholder} users.')
            .replace('{user_number_placeholder}', length);
        toaster.success(msg);
      }
      res.data.failed.map(item => {
        const msg = `${item.email}: ${item.error_msg}`;
        toaster.danger(msg);
        return item;
      });
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  importUserInBatch = (file) => {
    toaster.notify(gettext('It may take some time, please wait.'));
    dtableWebAPI.sysAdminImportUserViaFile(file).then((res) => {
      if (res.data.success.length) {
        const users = res.data.success.map(item => {
          if (item.institution === undefined) {
            item.institution = '';
          }
          return new SysAdminUser(item);
        });
        this.setState({
          userList: users.concat(this.state.userList) 
        });
      }
      res.data.failed.map(item => {
        const msg = `${item.email}: ${item.error_msg}`;
        toaster.danger(msg);
        return item;
      });
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error);
      toaster.danger(errMsg);
    });
  }

  addUser = (data) => {
    toaster.notify(gettext('It may take some time, please wait.'));
    const { email, name, role, password } = data;
    dtableWebAPI.sysAdminAddUser(email, name, role, password).then((res) => {
      let userList = this.state.userList;
      userList.unshift(res.data);
      this.setState({
        userList: userList
      });
      toaster.success(res.data.add_user_tip);
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error);
      toaster.danger(errMsg);
    });
  }

  resetPerPage = (perPage) => {
    this.setState({
      perPage: perPage
    }, () => {
      this.getUsersListByPage(1);
    });
  }

  updateUser = (email, key, value) => {
    dtableWebAPI.sysAdminUpdateUser(email, key, value).then(res => {
      let newUserList = this.state.userList.map(item => {
        if (item.email === email) {
          item[key]= res.data[key];
        }
        return item;
      });
      this.setState({userList: newUserList});
      const msg = (key === 'is_active' && value) ? 
        res.data.update_status_tip : gettext('Edit succeeded');
      toaster.success(msg);
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  updateAdminRole = (email, role) => {
    dtableWebAPI.sysAdminUpdateAdminRole(email, role).then(res => {
      let newUserList = this.state.userList.map(item => {
        if (item.email === email) {
          item.admin_role = res.data.role;
        }
        return item;
      });
      this.setState({userList: newUserList});
      toaster.success(gettext('Edit succeeded'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  revokeAdmin = (email, name) => {
    dtableWebAPI.sysAdminUpdateUser(email, 'is_staff', false).then(res => {
      let userList = this.state.userList.filter(item => {
        return item.email !== email;
      }); 
      this.setState({
        userList: userList
      });
      toaster.success(gettext('Successfully revoked the admin permission of {placeholder}'.replace('{placeholder}', name)));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  downloadUserExcel = () => {
    const url = `${siteRoot}sys/useradmin/export-excel/`;
    location.href = url;
  }

  getOperationsForAll = () => {
    const { isAdmin } = this.props;

    if (isAdmin) {
      return <Button className="btn btn-secondary operation-item" onClick={this.toggleBatchAddAdminDialog}>{gettext('Add Admin')}</Button>;
    }

    // if (isLDAPImported) {
    //   return <a className="btn btn-secondary operation-item" href={`${siteRoot}sys/useradmin/export-excel/`}>{gettext('Export Excel')}</a>;
    // }

    // 'database'
    return (
      <Fragment>
        <Button className="btn btn-secondary operation-item" onClick={this.toggleImportUserDialog}>{gettext('Import Users')}</Button>
        <Button className="btn btn-secondary operation-item" onClick={this.toggleAddUserDialog}>{gettext('Add User')}</Button>
        <a className="btn btn-secondary operation-item" href={`${siteRoot}sys/useradmin/export-excel/`}>{gettext('Export Excel')}</a>
      </Fragment>
    );
  }

  getMobileOperationsForAll = () => {
    const { isAdmin } = this.props;

    if (isAdmin) {
      return <span className="mobile-dropdown-item dropdown-item" onClick={this.toggleBatchAddAdminDialog}>{gettext('Add Admin')}</span>;
    }

    // if (isLDAPImported) {
    //   return <a className="btn btn-secondary operation-item" href={`${siteRoot}sys/useradmin/export-excel/`}>{gettext('Export Excel')}</a>;
    // }

    // 'database'
    return (
      <Fragment>
        <span className="mobile-dropdown-item dropdown-item" onClick={this.toggleImportUserDialog}>{gettext('Import Users')}</span>
        <span className="mobile-dropdown-item dropdown-item" onClick={this.toggleAddUserDialog}>{gettext('Add User')}</span>
        <span className="mobile-dropdown-item dropdown-item" onClick={this.downloadUserExcel}>{gettext('Export Excel')}</span>
      </Fragment>
    );
  }

  getCurrentNavItem = () => {
    const { isAdmin } = this.props;
    let item = 'database';
    if (isAdmin) {
      item = 'admin';
    } 
    // else if (isLDAPImported) {
    //   item = 'ldap-imported';
    // }
    return item;
  }

  toggleBatchAddAdminDialog = () => {
    this.setState({isBatchAddAdminDialogOpen: !this.state.isBatchAddAdminDialogOpen});
  }  

  addAdminInBatch = (emails) => {
    dtableWebAPI.sysAdminAddAdminInBatch(emails).then(res => {
      let users = res.data.success.map(user => {
        return new SysAdminAdminUser(user);
      });
      this.setState({
        userList: users.concat(this.state.userList) 
      });
      res.data.failed.map(item => {
        const msg = `${item.email}: ${item.error_msg}`;
        toaster.danger(msg);
        return item;
      });
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  getSearch = () => {
    if (this.props.isAdmin) {
      return null;
    }
    // offer 'Search' for 'DB' & 'LDAPImported' users
    return <Search
      placeholder={gettext('Search users')}
      submit={this.searchItems}
    />;
  }

  searchItems = (keyword) => {
    navigate(`${siteRoot}sys/search-users/?query=${encodeURIComponent(keyword)}`);
  }

  render() {
    const { isAdmin, isLDAPImported } = this.props;
    const {
      hasUserSelected, 
      isImportUserDialogOpen,
      isAddUserDialogOpen, 
      isBatchDeleteUserDialogOpen, 
      isBatchSetQuotaDialogOpen,
      isBatchAddAdminDialogOpen
    } = this.state;
    const isDesktop = Utils.isDesktop();
    let MainPanelTopbarContainer;
    if (isDesktop) {
      MainPanelTopbarContainer = <MainPanelTopbar search={this.getSearch()}>
        {hasUserSelected ?
          <Fragment>
            <Button className="btn btn-secondary operation-item" onClick={this.toggleBatchSetQuotaDialog}>{gettext('Set Quota')}</Button>
            <Button className="btn btn-secondary operation-item" onClick={this.toggleBatchDeleteUserDialog}>{gettext('Delete Users')}</Button>
          </Fragment> :
          this.getOperationsForAll()
        }
      </MainPanelTopbar>;
    } else {
      MainPanelTopbarContainer = <MainPanelTopbar search={this.getSearch()} onCloseSidePanel={this.props.onCloseSidePanel}>
        {hasUserSelected ?
          <Fragment>
            <span className="mobile-dropdown-item dropdown-item" onClick={this.toggleBatchSetQuotaDialog}>{gettext('Set Quota')}</span>
            <span className="mobile-dropdown-item dropdown-item" onClick={this.toggleBatchDeleteUserDialog}>{gettext('Delete Users')}</span>
          </Fragment> :
          this.getMobileOperationsForAll()
        }
      </MainPanelTopbar>;
    }
    return (
      <Fragment>
        {MainPanelTopbarContainer}
        <div className="main-panel-center flex-row">
          <div className="cur-view-container">
            <UsersNav currentItem={this.getCurrentNavItem()} />
            <div className="cur-view-content">
              <Content
                isAdmin={isAdmin}
                isLDAPImported={isLDAPImported}
                loading={this.state.loading}
                errorMsg={this.state.errorMsg}
                items={this.state.userList}
                currentPage={this.state.currentPage}
                hasNextPage={this.state.hasNextPage}
                curPerPage={this.state.perPage}
                resetPerPage={this.resetPerPage}
                getListByPage={this.getUsersListByPage}
                updateUser={this.updateUser}
                deleteUser={this.deleteUser}
                updateAdminRole={this.updateAdminRole}
                revokeAdmin={this.revokeAdmin}
                onUserSelected={this.onUserSelected}
                isAllUsersSelected={this.state.isAllUsersSelected}
                toggleSelectAllUsers={this.toggleSelectAllUsers}
              />
            </div>
          </div>
        </div>
        {isImportUserDialogOpen &&
        <SysAdminImportUserDialog
          toggle={this.toggleImportUserDialog}
          importUserInBatch={this.importUserInBatch}
        />
        }
        {isAddUserDialogOpen &&
          <SysAdminAddUserDialog
            dialogTitle={gettext('Add User')}
            showRole={isPro}
            availableRoles={availableRoles}
            addUser={this.addUser}
            toggleDialog={this.toggleAddUserDialog}
          />
        }
        {isBatchSetQuotaDialogOpen &&
          <SysAdminUserSetQuotaDialog
            toggle={this.toggleBatchSetQuotaDialog}
            updateQuota={this.setUserQuotaInBatch}
          />
        }
        {isBatchDeleteUserDialogOpen &&
          <CommonOperationConfirmationDialog
            title={gettext('Delete Users')}
            message={gettext('Are you sure you want to delete the selected user(s) ?')}
            executeOperation={this.deleteUserInBatch}
            confirmBtnText={gettext('Delete')}
            toggleDialog={this.toggleBatchDeleteUserDialog}
          />
        }
        {isBatchAddAdminDialogOpen &&
          <SysAdminBatchAddAdminDialog
            addAdminInBatch={this.addAdminInBatch}
            toggle={this.toggleBatchAddAdminDialog}
          />
        }
      </Fragment>
    );
  }
}

UsersAll.propTypes = userAllPropTypes;

export default UsersAll;
