import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../../utils/constants';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const propTypes = {
  currentTable: PropTypes.object.isRequired,
  restoreCancel: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

class RestoreTableDialog extends React.Component {

  toggle = () => {
    this.props.restoreCancel();
  }
  
  render() {
    let currentTable = this.props.currentTable;
    let name = currentTable.name;

    return (
      <Modal isOpen={true} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}>{gettext('Restore Table')}</ModalHeader>
        <ModalBody>
          <p>{gettext('Are you sure to restore')}{' '}<b>{name}</b> ?</p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>{gettext('Cancel')}</Button>
          <Button color="primary" onClick={this.props.handleSubmit}>{gettext('Restore')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

RestoreTableDialog.propTypes = propTypes;

export default RestoreTableDialog;
