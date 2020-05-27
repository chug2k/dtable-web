import React from 'react';
import PropTypes from 'prop-types';
import { gettext, canInvitePeople, siteRoot, cloudMode, isOrgContext } from '../../../utils/constants';
import { Button } from 'reactstrap';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import UserSelect from '../../../components/user-select';
import DtableSharePermissionEditor from '../../../components/select-editor/dtable-share-permission-editor';
import toaster from '../../../components/toast';
import { Utils } from '../../../utils/utils';
import '../../../css/invitations.css';

const userItemPropTypes = {
  item: PropTypes.object.isRequired,
  deleteTableShare: PropTypes.func.isRequired,
  updateTableShare: PropTypes.func.isRequired,
};

class UserItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isOperationShow: false
    };
  }

  onMouseEnter = () => {
    this.setState({isOperationShow: true});
  };

  onMouseLeave = () => {
    this.setState({isOperationShow: false});
  };

  deleteTableShare = () => {
    this.props.deleteTableShare(this.props.item.email);
  };

  updateTableShare = (permission) => {
    this.props.updateTableShare(this.props.item.email, permission);
  };

  render() {
    let item = this.props.item;
    let currentPermission = item.permission;

    return (
      <tr onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <td className="name">{item.name}</td>
        <td>
          <DtableSharePermissionEditor
            isTextMode={true}
            isEditIconShow={this.state.isOperationShow}
            currentPermission={currentPermission}
            onPermissionChanged={this.updateTableShare}
          />
        </td>
        <td>
          <span
            className={`dtable-font dtable-icon-x action-icon ${this.state.isOperationShow ? '' : 'hide'}`}
            onClick={this.deleteTableShare}
            title={gettext('Delete')}
          >
          </span>
        </td>
      </tr>
    );
  }
}

UserItem.propTypes = userItemPropTypes;

const propTypes = {
  currentTable: PropTypes.object.isRequired,
};

class ShareTableToUser extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedOptions: null,
      permission: 'rw',
      userList: []
    };
    this.workspaceID = this.props.currentTable.workspace_id;
    this.tableName = this.props.currentTable.name;
  }

  componentDidMount() {
    dtableWebAPI.listTableShares(this.workspaceID, this.tableName).then((res) => {
      this.setState({userList: res.data.user_list});
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  handleSelectChange = (options) => {
    this.setState({ selectedOptions: options });
  };

  setPermission = (permission) => {
    this.setState({permission: permission});
  };

  addTableShare = () => {
    const { selectedOptions, permission, userList } = this.state;
    if (!selectedOptions || selectedOptions.length === 0) return;
    for (let i = 0; i < selectedOptions.length; i++) {
      let name = selectedOptions[i].value;
      let email = selectedOptions[i].email;
      dtableWebAPI.addTableShare(this.workspaceID, this.tableName, email, permission).then((res) => {
        let userInfo = {
          name: name,
          email: email,
          permission: permission,
        };
        userList.push(userInfo);
        this.setState({ userList: userList });
      }).catch(error => {
        let errMsg = Utils.getErrorMsg(error, true);
        if (!error.response || error.response.status !== 403) {
          toaster.danger(errMsg);
        }
      });
    }
    this.setState({ selectedOption: null });
    this.refs.userSelect.clearSelect();
  };

  deleteTableShare = (email) => {
    dtableWebAPI.deleteTableShare(this.workspaceID, this.tableName, email).then((res) => {
      let userList = this.state.userList.filter(userInfo => {
        return userInfo.email !== email;
      });
      this.setState({
        userList: userList,
      });
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  };

  updateTableShare = (email, permission) => {
    dtableWebAPI.updateTableShare(this.workspaceID, this.tableName, email, permission).then((res) => {
      let userList = this.state.userList.filter(userInfo => {
        if (userInfo.email === email) {
          userInfo.permission = permission;
        }
        return userInfo;
      });
      this.setState({
        userList: userList,
      });
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  };

  render() {
    const renderUserList = this.state.userList.map((item, index) => {
      return (
        <UserItem
          key={index}
          item={item}
          deleteTableShare={this.deleteTableShare}
          updateTableShare={this.updateTableShare}
        />
      );
    });

    return (
      <div className="share-link-container">
        {cloudMode && !isOrgContext &&
          <div className="share-link-tip">{gettext('Please input the full email to share to the user. You can also generate a share link and send it to another user to join the table.')}</div>}
        <table>
          <thead>
            <tr>
              <th width="50%">{gettext('User')}</th>
              <th width="35%">{gettext('Permission')}</th>
              <th width="15%"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <UserSelect
                  ref="userSelect"
                  isMulti={true}
                  className="reviewer-select"
                  placeholder={gettext('Select users...')}
                  onSelectChange={this.handleSelectChange}
                />
              </td>
              <td>
                <DtableSharePermissionEditor
                  isTextMode={false}
                  isEditIconShow={false}
                  currentPermission={this.state.permission}
                  onPermissionChanged={this.setPermission}
                />
              </td>
              <td>
                <Button onClick={this.addTableShare}>{gettext('Submit')}</Button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="share-list-container">
          <table className="table-thead-hidden">
            <thead>
              <tr>
                <th width="50%">{gettext('User')}</th>
                <th width="35%">{gettext('Permission')}</th>
                <th width="15%"></th>
              </tr>
            </thead>
            <tbody>
              {renderUserList}
            </tbody>
          </table>
          { canInvitePeople &&
          <a href={siteRoot + 'invitations/'} className="invite-link-in-popup">
            <i className="dtable-font dtable-icon-invite invite-link-icon-in-popup"></i>
            <span className="invite-link-icon-in-popup">{gettext('Invite People')}</span>
          </a>
          }
        </div>
      </div>
    );
  }
}

ShareTableToUser.propTypes = propTypes;

export default ShareTableToUser;
