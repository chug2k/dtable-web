import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../../utils/constants';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import Loading from '../../../components/loading';

const propTypes = {
  isExporting: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  cancelDTableIOTask: PropTypes.func.isRequired,
  canCancelIOTask: PropTypes.bool,
};

class DTableIODialog extends React.Component {

  static defaultProps = {
    canCancelIOTask: true
  }

  toggle = () => {
    this.props.toggle();
  }
  
  render() {
    let importMsg = gettext('Importing');
    let exportMsg = gettext('Exporting');
    return (
      <Modal isOpen={true}>
        <ModalHeader>{this.props.isExporting ? exportMsg : importMsg}</ModalHeader>
        <ModalBody>
          <Loading/>
        </ModalBody>
        {this.props.canCancelIOTask &&
          <ModalFooter>
            <Button color="secondary" onClick={this.props.cancelDTableIOTask}>{gettext('Cancel')}</Button>
          </ModalFooter>
        }
      </Modal>
    );
  }
}

DTableIODialog.propTypes = propTypes;

export default DTableIODialog;
