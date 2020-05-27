import React, { Fragment } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { gettext } from '../../../utils/constants';
import MainPanelTopbar from '../main-panel-topbar';
import StatisticCommonTool from './statistic-common-tool';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import StatisticChart from './statistic-chart';
import Loading from '../../../components/loading';
import { Utils } from '../../../utils/utils';
import toaster from '../../../components/toast';

import '../../../css/system-stat.css';

const propTypes = {
  onCloseSidePanel: PropTypes.func
};

class StatisticUsers extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      filesData: [],
      labels: [],
      isLoading: true,
    };
  }

  getActiviesFiles = (startTime, endTime, groupBy) => {
    let { filesData } = this.state;
    dtableWebAPI.sysAdminStatisticActiveUsers(startTime, endTime, groupBy).then((res) => {
      let labels = [],
        count = [];
      let data = res.data.active_users;
      if (Array.isArray(data)) {
        data.forEach(item => {
          labels.push(moment(item.datetime).format('YYYY-MM-DD'));
          count.push(item.count);
        });
        let userCount = {
          label: gettext('Active Users'),
          data: count, 
          borderColor: '#fd913a',
          backgroundColor: '#fd913a'};
        filesData = [userCount];
      }
      this.setState({
        filesData: filesData,
        labels: labels,
        isLoading: false
      });
    }).catch(err => {
      let errMessage = Utils.getErrorMsg(err);
      toaster.danger(errMessage);
    });
  }

  render() {
    let { labels, filesData, isLoading } = this.state;
    return (
      <Fragment>
        <MainPanelTopbar onCloseSidePanel={this.props.onCloseSidePanel} />
        <div className="cur-view-container">
          <div className="cur-view-content">
            <StatisticCommonTool getActiviesFiles={this.getActiviesFiles} />
            {isLoading && <Loading />}
            {!isLoading && labels.length > 0 && 
              <StatisticChart 
                labels={labels}
                filesData={filesData}
                suggestedMaxNumbers={10}
                isLegendStatus={false}
                chartTitle={gettext('Active Users')}
              />
            }
          </div>
        </div>
      </Fragment>
    );
  }
}

StatisticUsers.propTypes = propTypes;

export default StatisticUsers;
