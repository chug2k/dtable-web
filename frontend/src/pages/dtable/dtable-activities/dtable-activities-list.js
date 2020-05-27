import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import DtableActivityItem from './dtable-activities-item';

const propTypes = {
  isLoadingMore: PropTypes.bool.isRequired,
  activities: PropTypes.array.isRequired,
  userListMap: PropTypes.object,
};

class DtableActivitiesList extends Component {

  render() {
    let { activities, isLoadingMore, userListMap } = this.props;

    return ( 
      <Fragment>
        <table className="table-hover table-thead-hidden activity-table">
          <thead>
            <tr>
              <th width="20%">{/* user */}</th>
              <th width="20%">{/* operation */}</th>
              <th width="45%">{/* detail */}</th>
              <th width="15%">{/* time */}</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((item, index) => {
              if (item.table_name) {
                return (
                  <DtableActivityItem 
                    key={index}
                    item={item}
                    index={index}
                    activities={activities}
                    userListMap={userListMap}
                  />
                );
              }
              return null;
            })}
          </tbody>
        </table>
        {isLoadingMore ? <span className="loading-icon loading-tip"></span> : ''}
      </Fragment>
    ); 
  }
}

DtableActivitiesList.propTypes = propTypes;

export default DtableActivitiesList;
