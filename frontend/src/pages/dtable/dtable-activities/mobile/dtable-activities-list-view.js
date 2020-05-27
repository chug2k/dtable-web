import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import DtableActivityItemView from './dtable-activities-item-view';
import ActivityExpandView from './activity-expand-view';

const propTypes = {
  isLoadingMore: PropTypes.bool.isRequired,
  activities: PropTypes.array.isRequired,
  userListMap: PropTypes.object,
};

class DtableActivitiesList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      expandActivityItem: ''
    };
  }

  onSaveExpandActivityItem = (expandActivityItem) => {
    this.setState({expandActivityItem});
  }

  onHideExpandActivityItem = () => {
    this.setState({expandActivityItem: ''});
  }

  render() {
    let { activities, isLoadingMore, userListMap } = this.props;
    let { expandActivityItem } = this.state;

    return ( 
      <Fragment>
        <table className="table-hover table-thead-hidden activity-table activity-table-view">
          <thead>
            <tr>
              <th width="15%"></th>
              <th width="85%"></th>
            </tr>
          </thead>
          <tbody>
            {activities.map((item, index) => {
              if (item.table_name) {
                return (
                  <DtableActivityItemView 
                    key={index}
                    item={item}
                    index={index}
                    activities={activities}
                    onSaveExpandActivityItem={this.onSaveExpandActivityItem}
                    userListMap={userListMap}
                  />
                );
              }
              return null;
            })}
          </tbody>
        </table>
        {isLoadingMore ? <span className="loading-icon loading-tip"></span> : ''}
        {expandActivityItem && 
          <ActivityExpandView
            activity={expandActivityItem}
            activityExpandToggle={this.onHideExpandActivityItem}
            userListMap={userListMap}
            isShowOldValue={expandActivityItem.op_type === 'modify_row' ? true : false}
          />}
      </Fragment>
    ); 
  }
}

DtableActivitiesList.propTypes = propTypes;

export default DtableActivitiesList;
