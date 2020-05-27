import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import Select from 'react-select';
import DtableSharePermissionEditor from '../../../components/select-editor/dtable-share-permission-editor';
import { gettext } from '../../../utils/constants';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { Utils } from '../../../utils/utils';
import toaster from '../../../components/toast';

import '../../../css/invitations.css';

const groupItemPropTypes = {
  groupShare: PropTypes.object.isRequired,
  updateTableShare: PropTypes.func.isRequired,
  deleteTableShare: PropTypes.func.isRequired,
};

class GroupItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isOperationShow: false
    };
  }

  onMouseEnter = () => {
    this.setState({isOperationShow: true});
  }

  onMouseLeave = () => {
    this.setState({isOperationShow: false});
  }

  updateTableShare = (permission) => {
    if (permission !== this.props.groupShare.permission) {
      this.props.updateTableShare(this.props.groupShare.group_id, permission);
    }
  }

  deleteTableShare = () => {
    this.props.deleteTableShare(this.props.groupShare.group_id);
  }
  
  render() {
    let { group_name, permission } = this.props.groupShare;
    return (
      <tr onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <td>{group_name}</td>
        <td>
          <DtableSharePermissionEditor
            isTextMode={true}
            isEditIconShow={this.state.isOperationShow}
            currentPermission={permission}
            onPermissionChanged={this.updateTableShare}
          />
        </td>
        <td>
          <span
            className={`dtable-font dtable-icon-x action-icon ${this.state.isOperationShow ? '' : 'hide'}`}
            onClick={this.deleteTableShare}
            title={gettext('Delete')}
          />
        </td>
      </tr>
    );
  }
}

GroupItem.propTypes = groupItemPropTypes;


const shareTableToGroupPropTypes = {
  currentTable: PropTypes.object.isRequired,
  onAddGroupSharedTable: PropTypes.func.isRequired,
  onLeaveGroupSharedTable: PropTypes.func.isRequired,
};


class ShareTableToGroup extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      permission: 'rw',
      groupID: null,
      groups: [],
      groupShares: [],
      currentSelected: null,
    };
  }

  componentDidMount() {
    let { workspace_id, name } = this.props.currentTable;
    dtableWebAPI.listWorkspaces().then((res) => {
      let groups = res.data.workspace_list.filter(item => {
        return item.owner_type === 'Group';
      }).map(item => {
        return { value: item.group_id, label: item.owner_name };
      });
      this.setState({ groups: groups });
      return dtableWebAPI.listTableGroupShares(workspace_id, name);
    }).then((res) => {
      this.setState({ groupShares: res.data.dtable_group_share_list});
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  setPermission = (permission) => {
    this.setState({permission: permission});
  }

  addTableShare = () => {
    let { groupID, permission } = this.state;
    let { workspace_id, name } = this.props.currentTable;
    dtableWebAPI.addTableGroupShare(workspace_id, name, groupID, permission).then((res) => {
      let groupShares = this.state.groupShares.slice();
      groupShares.push(res.data.dtable_group_share);
      this.props.onAddGroupSharedTable(groupID, this.props.currentTable);
      this.setState({groupShares: groupShares, currentSelected: null});
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  updateTableShare = (groupID, permission) => {
    let { workspace_id, name } = this.props.currentTable;
    dtableWebAPI.updateTableGroupShare(workspace_id, name, groupID, permission).then(() => {
      let groupShares = this.state.groupShares.slice();
      groupShares = groupShares.map((item) => {
        if (item.group_id === groupID) {
          item.permission = permission;
        }
        return item;
      });
      this.setState({groupShares: groupShares});
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  deleteTableShare = (groupID) => {
    let { workspace_id, name } = this.props.currentTable;
    dtableWebAPI.deleteTableGroupShare(workspace_id, name, groupID).then(() => {
      let groupShares = this.state.groupShares.slice();
      groupShares = groupShares.filter((item) => {return item.group_id !== groupID;});
      this.setState({groupShares: groupShares});
      this.props.onLeaveGroupSharedTable(groupID, this.props.currentTable);
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  setGroup = (e) => {
    this.setState({groupID: e.value, currentSelected: e});
  }

  render() {
    let { groupShares } = this.state;
    let renderList = groupShares.map((item, index) => {
      return (
        <GroupItem 
          groupShare={item}
          key={index}
          updateTableShare={this.updateTableShare}
          deleteTableShare={this.deleteTableShare}
        />
      );
    });
    return (
      <div className="share-link-container">
        <table>
          <thead>
            <tr>
              <th width='50%'>{gettext('Group')}</th>
              <th width='35%'>{gettext('Permission')}</th>
              <th width='15%'></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Select
                  value={this.state.currentSelected}
                  options={this.state.groups}
                  placeholder={gettext('Select groups...')}
                  onChange={this.setGroup}
                  captureMenuScroll={false}
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
        <div className="h-100">
          <table className="table-thead-hidden">
            <thead>
              <tr>
                <th width="50%">{gettext('Group')}</th>
                <th width="35%">{gettext('Permission')}</th>
                <th width="15%"></th>
              </tr>
            </thead>
            <tbody>
              {renderList}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

ShareTableToGroup.propTypes = shareTableToGroupPropTypes;

export default ShareTableToGroup;
