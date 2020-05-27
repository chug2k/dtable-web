import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../../utils/constants';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const propTypes = {
  currentToken: PropTypes.object.isRequired,
  deleteCancel: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

class DeleteTokenDialog extends React.Component {

  toggle = () => {
    this.props.deleteCancel();
  }
  
  render() {
    let currentToken = this.props.currentToken;
    let app_name = currentToken.app_name;

    return (
      <Modal isOpen={true} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}>{gettext('Delete Token')}</ModalHeader>
        <ModalBody>
          <p>{gettext('Are you sure to delete')}{' '}<b>{app_name}</b> ?</p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>{gettext('Cancel')}</Button>
          <Button color="primary" onClick={this.props.handleSubmit}>{gettext('Delete')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

DeleteTokenDialog.propTypes = propTypes;

export default DeleteTokenDialog;
