import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { gettext } from '../../../utils/constants';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import Workspace from '../model/workspace';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Label } from 'reactstrap';

const propTypes = {
  dtable: PropTypes.object.isRequired,
  copyCancel: PropTypes.func.isRequired,
  copyDTable: PropTypes.func.isRequired,
};

class CopyDTableDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dstWorkspace: null,
      options: [],
    };
  }

  componentDidMount() {
    const currentWorkspaceID = this.props.dtable.workspace_id;
    dtableWebAPI.listWorkspaces().then((res) => {
      const { workspace_list } = res.data;
      let options = [];
      for (let i = 0; i < workspace_list.length; i++) {
        if (workspace_list[i].id !== currentWorkspaceID) {
          let workSpace = new Workspace(workspace_list[i]);
          let option = {
            value: workSpace,
            label: <div>{workSpace.owner_type !== 'Personal' ? workSpace.owner_name : gettext('My Tables')}</div>
          };
          options.push(option);
        }
      }
      this.setState({options});
    });
  }

  toggle = () => {
    this.props.copyCancel();
  }

  handleSubmit = () => {
    this.props.copyDTable(this.props.dtable, this.state.dstWorkspace);
  }

  setDstWorkspace = (e) => {
    this.setState({dstWorkspace: e.value});
  }

  render() {
    let { dtable } = this.props;
    return (
      <Modal isOpen={true} toggle={this.toggle} size="md">
        <ModalHeader toggle={this.toggle}>
          <span className="mr-1">{gettext('Copy')}</span>
          <span className="op-target" title={dtable.name}>{dtable.name}</span>
        </ModalHeader>
        <ModalBody >
          <Label for="copy-to-group">{gettext('Copy to')}</Label>          
          <Select
            options={this.state.options}
            placeholder={gettext('Please select a group')}
            onChange={this.setDstWorkspace}
            captureMenuScroll={false}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>{gettext('Cancel')}</Button>
          <Button color="primary" onClick={this.handleSubmit} disabled={!this.state.dstWorkspace}>
            {gettext('Submit')}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

CopyDTableDialog.propTypes = propTypes;

export default CopyDTableDialog;
