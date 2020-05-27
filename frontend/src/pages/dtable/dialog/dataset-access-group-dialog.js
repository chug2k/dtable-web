import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, Alert } from 'reactstrap';
import { gettext } from '../../../utils/constants';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import toaster from '../../../components/toast';
import { Utils } from '../../../utils/utils';
import Select from 'react-select';
import makeAnimated from 'react-select/lib/animated';

class DatasetAccessGroupDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accessGroupList: [],
      selectedGroups: [],
    };
  }

  componentDidMount() {
    dtableWebAPI.listDatasetAccessibleGroups(this.props.datasetId).then(res => {
      this.setState({
        accessGroupList: res.data.accessible_group_list
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
    dtableWebAPI.listShareableGroups().then((res) => {
      this.shareableGroupOptions = [];
      for (let i = 0 ; i < res.data.length; i++) {
        let obj = {};
        obj.value = res.data[i].name;
        obj.id = res.data[i].id;
        obj.label = res.data[i].name;
        this.shareableGroupOptions.push(obj);
      }
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  handleSelectChange = (option) => {
    this.setState({selectedGroups: option});
  }

  addGroup = () => {
    let groupIdList = this.state.selectedGroups.map(selectedGroup => selectedGroup.id);
    dtableWebAPI.addDatasetAccessibleGroup(this.props.datasetId, groupIdList).then(res => {
      const { success_list, failed_list } = res.data;
      let errMsg = gettext('Add {group_count} Group(s), {success_count} succeed, {failed_count} failed');
      errMsg = errMsg.replace('{group_count}', groupIdList.length);
      errMsg = errMsg.replace('{success_count}', success_list.length);
      errMsg = errMsg.replace('{failed_count}', failed_list.length);
      this.setState({
        accessGroupList: this.state.accessGroupList.concat(success_list),
        selectedGroups: [],
      });
      if (res.data.failed_list.length === 0) {
        toaster.success(errMsg);
      } else {
        toaster.danger(errMsg);
      }
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  deleteGroup = (groupID) => {
    dtableWebAPI.deleteDatasetAccessibleGroup(this.props.datasetId, groupID).then(res => {
      this.setState({
        accessGroupList: this.state.accessGroupList.filter(group => group.group_id !== groupID)
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  toggle = () => {
    this.props.toggle();
  }

  render() {
    const isDesktop = Utils.isDesktop();

    let { accessGroupList, errMessage, selectedGroups } = this.state;
    return (
      <Modal isOpen={true} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}>{gettext('Access Permissions')}</ModalHeader>
        <ModalBody className="share-dialog-content">
          <table>
            <thead>
              <tr>
                <th width={isDesktop ? '88%' : '80%'}>{gettext('Grant access to group')}</th>
                <th width={isDesktop ? '12%' : '20%'}/>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Select
                    isMulti
                    onChange={this.handleSelectChange}
                    options={this.shareableGroupOptions}
                    placeholder={gettext('Select groups...')}
                    components={makeAnimated()}
                    maxMenuHeight={200}
                    inputId="react-select-2-input"
                    value={selectedGroups}
                  />
                </td>
                <td>
                  <Button onClick={this.addGroup}>{gettext('Add')}</Button>
                </td>
              </tr>
            </tbody>
          </table>
          {errMessage && <Alert color="danger" className="mt-2">{errMessage}</Alert>}
          {accessGroupList && accessGroupList.length > 0 &&
            <div className="dtable-share-link-list-container">
              <div className="h-100" style={{maxHeight: '16.75rem'}}>
                <table>
                  <thead>
                    <tr>
                      <th width="92%">{gettext('Group Name')}</th>
                      <th width="8%"/>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      accessGroupList.map((group, index) => {
                        return (<GroupItem key={index} group={group} deleteGroup={this.deleteGroup}/>);
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </ModalBody>
      </Modal>
    );
  }
}

const propTypes = {
  datasetId: PropTypes.number.isRequired,
  toggle: PropTypes.func.isRequired,
};

DatasetAccessGroupDialog.propTypes = propTypes;

class GroupItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowDelete: false,
    };
  }

  onMouseOver = () => {
    this.setState({isShowDelete: !this.state.isShowDelete});
  }

  deleteGroup = () => {
    const group = this.props.group;
    if (group && group.group_id) {
      this.props.deleteGroup(group.group_id);
    }
  }

  render() {
    let { group } = this.props;
    return (
      <tr onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOver}>
        <td>{group.group_name}</td>
        <td>
          <span
            className={`dtable-font dtable-icon-x action-icon ${this.state.isShowDelete ? '' : 'hide'}`}
            onClick={this.deleteGroup}
            title={gettext('Delete')}
          />
        </td>
      </tr>
    );
  }
}

const GroupItemPropTypes = {
  group: PropTypes.object.isRequired,
  deleteGroup: PropTypes.func.isRequired,
};

GroupItem.propTypes = GroupItemPropTypes;

export default DatasetAccessGroupDialog;
