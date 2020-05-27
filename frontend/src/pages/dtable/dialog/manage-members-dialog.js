import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../../utils/constants';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Table } from 'reactstrap';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import RoleEditor from '../../../components/select-editor/role-editor';
import UserSelect from '../../../components/user-select';
import { Utils } from '../../../utils/utils';
import toaster from '../../../components/toast';
import '../../../css/manage-members-dialog.css';

const propTypes = {
  groupID: PropTypes.string.isRequired,
  toggleManageMembersDialog: PropTypes.func.isRequired,
  isOwner: PropTypes.bool.isRequired,
};

class ManageMembersDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      groupMembers: [],
      selectedOption: null,
      errMessage: [],
      isItemFreezed: false,
    };
  }

  onSelectChange = (option) => {
    this.setState({
      selectedOption: option,
      errMessage: [],
    });
  }

  addGroupMember = () => {
    let emails = [];
    for (let i = 0; i < this.state.selectedOption.length; i++) {
      emails.push(this.state.selectedOption[i].email);
    }
    dtableWebAPI.addGroupMembers(this.props.groupID, emails).then((res) => {
      this.onGroupMembersChange();
      this.setState({
        selectedOption: null,
      });
      this.refs.userSelect.clearSelect();
      if (res.data.failed.length > 0) {
        this.setState({
          errMessage: res.data.failed
        });
      }
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  listGroupMembers = () => {
    dtableWebAPI.listGroupMembers(this.props.groupID).then((res) => {
      this.setState({
        groupMembers: res.data
      });
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  onGroupMembersChange = () => {
    this.listGroupMembers();
  }

  toggleItemFreezed = (isFreezed) => {
    this.setState({
      isItemFreezed: isFreezed
    });
  }

  toggle = () => {
    this.props.toggleManageMembersDialog();
  }

  componentDidMount() {
    this.listGroupMembers();
  }

  render() {
    return (
      <Modal isOpen={true} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}>{gettext('Manage group members')}</ModalHeader>
        <ModalBody>
          <p>{gettext('Add group member')}</p>
          <div className='add-members'>
            <UserSelect
              placeholder={gettext('Select users...')}
              onSelectChange={this.onSelectChange}
              ref="userSelect"
              isMulti={true}
              className="add-members-select"
            />
            {this.state.selectedOption ?
              <Button color="secondary" onClick={this.addGroupMember}>{gettext('Submit')}</Button> :
              <Button color="secondary" disabled>{gettext('Submit')}</Button>
            }
          </div>
          {
            this.state.errMessage.length > 0 &&
            this.state.errMessage.map((item, index) => {
              return (
                <div className="group-error error" key={index}>{item.error_msg}</div>
              );
            })
          }
          <div className="manage-members">
            <Table size="sm" className="manage-members-table">
              <thead>
                <tr>
                  <th width="15%"></th>
                  <th width="45%">{gettext('Name')}</th>
                  <th width="30%">{gettext('Role')}</th>
                  <th width="10%"></th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.groupMembers.length > 0 &&
                  this.state.groupMembers.map((memberItem, index) => {
                    return (
                      <React.Fragment key={index}>
                        <Member
                          memberItem={memberItem}
                          onGroupMembersChange={this.onGroupMembersChange}
                          groupID={this.props.groupID}
                          isOwner={this.props.isOwner}
                          isItemFreezed={this.state.isItemFreezed}
                          toggleItemFreezed={this.toggleItemFreezed}
                        />
                      </React.Fragment>
                    );
                  })
                }
              </tbody>
            </Table>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>{gettext('Close')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

ManageMembersDialog.propTypes = propTypes;

const MemberPropTypes = {
  memberItem: PropTypes.object.isRequired,
  groupID: PropTypes.string.isRequired,
  isOwner: PropTypes.bool.isRequired,
  onGroupMembersChange: PropTypes.func.isRequired,
  isItemFreezed: PropTypes.bool,
  toggleItemFreezed: PropTypes.func.isRequired,
};

class Member extends React.PureComponent {

  constructor(props) {
    super(props);
    this.roles = ['Admin', 'Member'];
    this.state = ({
      highlight: false,
    });
  }

  onChangeUserRole = (role) => {
    let isAdmin = role === 'Admin' ? 'True' : 'False';
    dtableWebAPI.setGroupAdmin(this.props.groupID, this.props.memberItem.email, isAdmin).then((res) => {
      this.props.onGroupMembersChange();
    });
    this.setState({
      highlight: false,
    });
  }

  deleteMember = (name) => {
    dtableWebAPI.deleteGroupMember(this.props.groupID, name).then((res) => {
      this.props.onGroupMembersChange();
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  handleMouseOver = () => {
    if (this.props.isItemFreezed) return;
    this.setState({
      highlight: true,
    });
  }

  handleMouseLeave = () => {
    if (this.props.isItemFreezed) return;
    this.setState({
      highlight: false,
    });
  }

  translateRole = (role) => {
    if (role === 'Admin') {
      return gettext('Admin');
    }  
    else if (role === 'Member') {
      return gettext('Member');
    }
    else if (role === 'Owner') {
      return gettext('Owner');
    }
  }

  render() {
    const { memberItem, isOwner } = this.props;
    const deleteAuthority = (memberItem.role !== 'Owner' && isOwner === true) || (memberItem.role === 'Member' && isOwner === false);
    return(
      <tr onMouseOver={this.handleMouseOver} onMouseLeave={this.handleMouseLeave} className={this.state.highlight ? 'editing' : ''}>
        <th scope="row"><img className="avatar" src={memberItem.avatar_url} alt=""/></th>
        <td>{memberItem.name}</td>
        <td>
          {((isOwner === false) || (isOwner === true && memberItem.role === 'Owner')) && 
            <span className="group-admin">{this.translateRole(memberItem.role)}</span>
          }
          {(isOwner === true && memberItem.role !== 'Owner') &&
            <RoleEditor 
              isTextMode={true}
              isEditIconShow={this.state.highlight}
              currentRole={memberItem.role}
              roles={this.roles}
              onRoleChanged={this.onChangeUserRole}
              toggleItemFreezed={this.props.toggleItemFreezed}
            />
          }
        </td>
        <td>
          {(deleteAuthority && !this.props.isItemFreezed) &&
            <i
              className="dtable-font dtable-icon-cancel delete-group-member-icon"
              name={memberItem.email}
              onClick={this.deleteMember.bind(this, memberItem.email)}>
            </i>
          }
        </td>
      </tr>
    );
  }
}

Member.propTypes = MemberPropTypes;

export default ManageMembersDialog;
