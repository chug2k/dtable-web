import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../../../utils/constants';
import { CELL_ICON, CELL_TYPE } from '../../../dtable-share-row/contants/contants';
import { getFormattedCellValue } from '../../utils/cell-value-format';
import classnames from 'classnames';

import '../../../../css/activity-expand-view.css';

class ActivityExpandView extends React.Component {

  constructor(props) {
    super(props);
    this.clientHeight = document.body.clientHeight;
  }

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
      <div className="activity-expand-view">
        <div className="activity-expand-view-header">
          <span className="activity-expand-view-header-btn" onClick={this.toggle}>
            <i className="dtable-icon-btn dtable-font dtable-icon-return"></i>
          </span>
          <h4 className="activity-expand-view-header-title">{gettext('Activity details')}</h4>
          <span className="activity-expand-view-header-btn"></span>
        </div>
        <div className="activity-expand-view-container" style={{height: this.clientHeight - 50}}>
          {this.getActivityDetails()}
        </div>
      </div>
    );
  }
}

const propTypes = {
  activity: PropTypes.object,
  activityExpandToggle: PropTypes.func,
  isShowOldValue: PropTypes.bool,
  userListMap: PropTypes.object,
};

ActivityExpandView.propTypes = propTypes;

export default ActivityExpandView;
