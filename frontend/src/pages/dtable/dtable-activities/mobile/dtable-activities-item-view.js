import React, { Component, Fragment } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { gettext, siteRoot } from '../../../../utils/constants';
import { getFormattedCellValue } from '../../utils/cell-value-format';
import ActivityExpandView from './activity-expand-view';


moment.locale(window.app.config.lang);

const propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  activities: PropTypes.array.isRequired,
  userListMap: PropTypes.object,
  onSaveExpandActivityItem: PropTypes.func,
};

class DtableActivityItem extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isActivityExpandshow: false,
    };
  }

  getRowName(item) {
    let { row_name } = item;
    if (row_name) {
      return row_name;
    }
    let rowName = '';
    let rowData = item.row_data;
    for (let cell of rowData) {
      if (cell.column_key === '0000') {
        rowName = cell.value;
        break;
      }
    }
    return rowName;
  }

  getRowDetail = (opType, rowName) => {
    return <div className={`activity-row-name ${opType === 'delete_row' ? 'activity-delete-row' : ''}`} >{rowName}</div>;
  }

  getMoreDetails = (opType, rowName) => {
    return <span 
      className={`activity-details ${rowName || opType === 'modify_row' ? 'row-name-exit' : ''}`} 
      onClick={() => this.props.onSaveExpandActivityItem(this.props.item)}
    >
      {gettext('Details')}
    </span>;
  }

  renderOpInfo = () => {
    let { item, index, activities, userListMap } = this.props;
    let op, details;
    let userProfileURL = `${siteRoot}profile/${encodeURIComponent(item.author_email)}/`;
    let { row_data, op_type, dtable_name } = item;

    let rowName = this.getRowName(item);
    let { newValues, oldValues } = getFormattedCellValue(row_data, false, userListMap);

    switch(op_type) {
      case 'delete_row':
        op =
          <div className="op-table-name">
            <span>{gettext('Delete row')}</span>
            <span className="activity-table-name">{dtable_name}</span>
          </div>;
        details = <div className="activity-item-view-row">
          {rowName && this.getRowDetail(op_type, rowName)}
          {this.getMoreDetails(op_type, rowName)}
        </div>;
        break;
      case 'insert_row':
        op =
          <div className="op-table-name">
            <span>{gettext('Insert row')}</span>
            <span className="activity-table-name">{dtable_name}</span>
          </div>;
        details = <div className="activity-item-view-row">
          {rowName && this.getRowDetail(op_type, rowName)}
          {this.getMoreDetails(op_type, rowName)}
        </div>;
        break;
      case 'modify_row':
        op =
          <div className="op-table-name">
            <span>{gettext('Modify row')}</span>
            <span className="activity-table-name">{dtable_name}</span>
          </div>;
        details = <Fragment>
          {rowName &&
            <div className="activity-item-view-modify-row">{this.getRowDetail(op_type, rowName)}</div>
          }
          <div className="activity-detail">
            <span className="detail-left">{oldValues[0]}</span>
            <span className="left-to-right">{'->'}</span>
            <span className="detail-right">{newValues[0]}</span>
            {this.getMoreDetails(op_type, rowName)}
          </div>
        </Fragment>;
        break;
      default:
        break;
    }

    let isShowDate = true;
    if (index > 0) {
      let lastEventTime = activities[index - 1].op_time;
      isShowDate = moment(item.op_time).isSame(lastEventTime, 'day') ? false : true;
    }

    return { isShowDate, op, details, userProfileURL };
  }

  activityExpandToggle = () => {
    this.setState({isActivityExpandshow: !this.state.isActivityExpandshow});
  }

  render() {
    let { item, userListMap } = this.props;
    
    let { dtable_name } = item;
    if (!dtable_name) return null;
    let { isShowDate, op, details, userProfileURL } = this.renderOpInfo();
    let { isActivityExpandshow } = this.state;
    return (
      <Fragment>
        {isShowDate &&
          <tr>
            <td colSpan={2} className="border-top-0">{moment(item.op_time).format('YYYY-MM-DD')}</td>
          </tr>
        }
        <tr>
          <td className="op-user-img">
            <img src={item.avatar_url} alt="" width="32" height="32" className="avatar" />
          </td>
          <td>
            <div className="activity-item-view"> 
              <a href={userProfileURL}>{item.author_name}</a>
              <time datetime={item.op_time} is="relative-time" title={moment(item.op_time).format('llll')}>{moment(item.op_time).fromNow()}</time>
            </div>
            {op}
            {details}
          </td>
        </tr>
        {isActivityExpandshow && 
          <ActivityExpandView
            activity={item}
            activityExpandToggle={this.activityExpandToggle}
            userListMap={userListMap}
            isShowOldValue={item.op_type === 'modify_row' ? true : false}
          />
        }
      </Fragment>
    );
  }
}

DtableActivityItem.propTypes = propTypes;

export default DtableActivityItem;
