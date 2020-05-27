import React, { Component, Fragment } from 'react';
import { Utils } from '../../utils/utils';
import Loading from '../../components/loading';
import { gettext } from '../../utils/constants';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import DtableActivityList from './dtable-activities/dtable-activities-list';
import DtableActivityListView from './dtable-activities/mobile/dtable-activities-list-view';
import { CELL_TYPE } from '../dtable-share-row/contants/contants';
import MediaQuery from 'react-responsive';
import Activity from './model/activities';

import '../../css/main-panel-activities.css';

let userListMap = {};

const updateUserListMap = (userList) => {
  userList.forEach(item => {
    if (!userListMap[item.email]) {
      userListMap[item.email] = item;
    }
  });
};

class MainPanelActivities extends Component {

  constructor(props) {
    super(props);
    this.state = {
      activities: [],
      currentPage: 1,
      isFirstLoading: true,
      isLoadingMore: false,
      hasMore: true,
      errorMsg: '',
    };
    this.avatarSize = 72;
  }

  getUserIdList = (activities) => {
    let userIdList = [];
    activities.forEach(item => {
      let { row_data } = item;
      row_data.forEach(v => {
        let { old_value, value, column_type } = v;
        if (column_type === CELL_TYPE.COLLABORATOR) {
          let oldValueArray = Array.isArray(old_value) ? old_value.filter(item => !userListMap[item]) : [];
          let valueArray = Array.isArray(value) ? value.filter(item => !userListMap[item]) : [];
          userIdList = [...userIdList, ...oldValueArray, ...valueArray];
        }
      });
    });
    return [...new Set(userIdList)];
  }

  componentDidMount() {
    let currentPage = this.state.currentPage;
    dtableWebAPI.getDTableActivities(currentPage, this.avatarSize).then((res) => {
      let activities = res.data.activities.map(activity => {
        return new Activity(activity);
      });
      let userIdList = this.getUserIdList(activities);
      if (userIdList.length > 0) {
        dtableWebAPI.listUserInfo(userIdList).then((re) => {
          let userList = re.data.user_list;
          updateUserListMap(userList);
          this.setState({
            isFirstLoading: false,
            activities: activities,
            currentPage: currentPage + 1,
          });
        }).catch(error => {
          this.setState({
            isFirstLoading: false,
            errorMsg: Utils.getErrorMsg(error),
          });
        });
      } else {
        this.setState({
          isFirstLoading: false,
          activities: activities,
          currentPage: currentPage + 1,
        });
      }
    }).catch((error) => {
      this.setState({
        isFirstLoading: false,
        errorMsg: Utils.getErrorMsg(error),
      });
    });
  }

  getMore() {
    let currentPage = this.state.currentPage;
    dtableWebAPI.getDTableActivities(currentPage, this.avatarSize).then((res) => {
      let activities = res.data.activities.map(activity => {
        return new Activity(activity);
      });
      let userIdList = this.getUserIdList(activities);
      if (userIdList.length > 0) {
        dtableWebAPI.listUserInfo(userIdList).then(re => {
          let userList = re.data.user_list;
          updateUserListMap(userList);
          this.setState({
            isLoadingMore: false,
            activities: [...this.state.activities, ...activities],
            currentPage: currentPage + 1,
            hasMore: activities.length === 0 ? false : true
          });
        }).catch(error => {
          this.setState({
            isLoadingMore: false,
            errorMsg: Utils.getErrorMsg(error),
          });
        });
      } else {
        this.setState({
          isLoadingMore: false,
          activities: [...this.state.activities, ...activities],
          currentPage: currentPage + 1,
          hasMore: activities.length === 0 ? false : true
        });
      }
    }).catch(error => {
      this.setState({
        isLoadingMore: false,
        errorMsg: Utils.getErrorMsg(error),
      });
    });
  }

  handleScroll = (event) => {
    if (!this.state.isLoadingMore && this.state.hasMore) {
      const clientHeight = event.target.clientHeight;
      const scrollHeight = event.target.scrollHeight;
      const scrollTop    = event.target.scrollTop;
      const isBottom = (clientHeight + scrollTop + 1 >= scrollHeight);
      if (isBottom) {
        this.setState({isLoadingMore: true}, () => {
          this.getMore();
        });
      }
    }
  }

  render() {
    return (
      <div className="main-panel-center">
        <div className="cur-view-container" id="activities">
          <div className="cur-view-content d-block" onScroll={this.handleScroll}>
            {this.state.isFirstLoading && <Loading />}
            {(!this.state.isFirstLoading && this.state.errorMsg) && 
              <p className="error text-center">{this.state.errorMsg}</p>
            }
            {!this.state.isFirstLoading && !this.state.errorMsg && (
              <Fragment>
                <MediaQuery query="(min-width: 767.8px)">
                  <div className="activities-title">{gettext('Activities')}</div>
                  <DtableActivityList activities={this.state.activities} isLoadingMore={this.state.isLoadingMore} userListMap={userListMap} />
                </MediaQuery>
                <MediaQuery query="(max-width: 767.8px)">
                  <div className="activities-view-title">{gettext('Activities')}</div>
                  <DtableActivityListView activities={this.state.activities} isLoadingMore={this.state.isLoadingMore} userListMap={userListMap} />
                </MediaQuery>
              </Fragment>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default MainPanelActivities;
