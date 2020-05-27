import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../../utils/constants';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { CELL_ICON, CELL_TYPE } from '../../dtable-share-row/contants/contants';
import { getFormattedCellValue } from '../utils/cell-value-format';
import classnames from 'classnames';

import '../../../css/activity-expand-dialog.css';

class ActivityExpandDialog extends React.Component {

  getActivityDetails = () => {
    const { activity, isShowOldValue, userListMap } = this.props;
    const { row_data } = activity;
    let { newValues, oldValues, columns } = getFormattedCellValue(row_data, true, userListMap);
    let activityDetails = [];
    columns.forEach((column, index) => {
      activityDetails.push(
        <div className="activity-column-detail" key={`activity-column-detail-${index}`}>
          <div className="activity-column-head"> 
            <i className={`column-icon ${CELL_ICON[column.type]}`}></i>
            <span className="column-detail-name">{column.name}</span>
          </div>
          <div className="activity-column-content">
            {isShowOldValue && <Fragment>
              <div className="activity-column-left">{oldValues[index]}</div>
              <div className={classnames('left-to-right', {'link-left-to-right': column.type === CELL_TYPE.LINK})}>-></div>
            </Fragment>}
            <div className="activity-column-right">{newValues[index]}</div>
          </div>
        </div>
      );
    });
    return activityDetails;
  }

  toggle = () => {
    this.props.activityExpandToggle();
  }

  onScroll = (e) => {
    e.stopPropagation();
  }

  render() {
    return (
      <Modal isOpen={true} toggle={this.toggle} className="activity-expand-dialog" contentClassName="activity-expand-content-container">
        <div className="activity-expand-details">
          <ModalHeader toggle={this.toggle}>
            <span>{gettext('Activity details')}</span>
          </ModalHeader>
          <ModalBody className="expand-activity-container" onScroll={(e) => this.onScroll(e)}>
            {this.getActivityDetails()}
          </ModalBody>
        </div>
      </Modal>
    );
  }
}

const propTypes = {
  activity: PropTypes.object,
  activityExpandToggle: PropTypes.func,
  isShowOldValue: PropTypes.bool,
  userListMap: PropTypes.object,
};

ActivityExpandDialog.propTypes = propTypes;

export default ActivityExpandDialog;
