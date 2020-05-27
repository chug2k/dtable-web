import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import { Router } from '@reach/router';
import { siteRoot, lang } from '../../utils/constants';
import SidePanel from './side-panel';
import MainPanel from './main-panel';
import WorkWeixinDepartments from './work-weixin-departments';
import Info from './info';

import Users from './users/users';
import AdminUsers from './users/admin-users';
import User from './users/user-info';
import UserGroups from './users/user-groups';
import SearchUsers from './users/search-users';

import StatisticsUsers from './statistic/statistic-users';
import WebSettings from './web-settings/web-settings';

import Orgs from './orgs/orgs';
import OrgInfo from './orgs/org-info';
import OrgUsers from './orgs/org-users';
import OrgGroups from './orgs/org-groups';
import SearchOrgs from './orgs/search-orgs';

import AllDTables from './dtables/all-dtables';
import TrashDTables from './dtables/trash-dtables';

import Groups from './groups/groups';
import GroupMembers from './groups/group-members';
import GroupStorages from './groups/group-storages';
import GroupDTables from './groups/group-dtables';
import SearchGroups from './groups/search-groups';

import ExternalLinks from './external-links/external-links';

import Notifications from './notifications/notifications';

import AdminOperationLogs from './admin-logs/operation-logs';
import AdminLoginLogs from './admin-logs/login-logs';

import MediaQuery from 'react-responsive';
import { Modal } from 'reactstrap';

import '../../css/layout.css';
import '../../css/toolbar.css';

moment.locale(lang);

class SysAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSidePanelClosed: true,
      currentTab: 'file-scan',
    };
  }

  componentDidMount() {
    let href = window.location.href.split('/');
    let currentTab = href[href.length - 2];

    const pageList = [
      {
        tab: 'organizations',
        urlPartList: ['organizations/', 'search-organizations/']
      },
      {
        tab: 'dtables',
        urlPartList: ['all-dtables/', 'trash-dtables/']
      },
      {
        tab: 'groups',
        urlPartList: ['groups/', 'search-groups/']
      },
      {
        tab: 'externalLinks',
        urlPartList: ['external-links/']
      },
      {
        tab: 'notifications',
        urlPartList: ['notifications/']
      },
      {
        tab: 'adminLogs',
        urlPartList: ['admin-logs/']
      },
      {
        tab: 'users',
        urlPartList: ['users/', 'search-users/']
      },
      {
        tab: 'statistics',
        urlPartList: ['statistics/users']
      }
    ];
    const tmpTab = this.getCurrentTabForPageList(pageList);
    currentTab = tmpTab ? tmpTab : currentTab;

    this.setState({currentTab: currentTab});
  }

  getCurrentTabForPageList = (pageList) => {
    let urlPartList, tab;
    const urlBase = `${siteRoot}sys/`;
    for (let i = 0, len = pageList.length; i < len; i++) {
      urlPartList = pageList[i].urlPartList;
      tab = pageList[i].tab;
      for (let j = 0, jlen = urlPartList.length; j < jlen; j++) {
        if (location.href.indexOf(`${urlBase}${urlPartList[j]}`) !== -1) {
          return tab;
        }
      }
    }
  }

  onCloseSidePanel = () => {
    this.setState({isSidePanelClosed: !this.state.isSidePanelClosed});
  }

  tabItemClick = (param) => {
    this.setState({currentTab: param});
  }  

  render() {
    let { currentTab, isSidePanelClosed } = this.state;

    return (
      <div id="main">
        <SidePanel
          isSidePanelClosed={isSidePanelClosed}
          onCloseSidePanel={this.onCloseSidePanel}
          currentTab={currentTab}
          tabItemClick={this.tabItemClick}
        />
        <MainPanel>
          <Router className="reach-router">
            <Info path={siteRoot + 'sys/info'} onCloseSidePanel={this.onCloseSidePanel} />
            <AllDTables path={siteRoot + 'sys/all-dtables'}  onCloseSidePanel={this.onCloseSidePanel} />
            <TrashDTables path={siteRoot + 'sys/trash-dtables'}></TrashDTables>
            <Orgs path={siteRoot + 'sys/organizations'} onCloseSidePanel={this.onCloseSidePanel} />
            <OrgInfo path={siteRoot + 'sys/organizations/:orgID/info'} onCloseSidePanel={this.onCloseSidePanel} />
            <OrgUsers path={siteRoot + 'sys/organizations/:orgID/users'} onCloseSidePanel={this.onCloseSidePanel} />
            <OrgGroups path={siteRoot + 'sys/organizations/:orgID/groups'} onCloseSidePanel={this.onCloseSidePanel} />
            <SearchOrgs path={siteRoot + 'sys/search-organizations/'} onCloseSidePanel={this.onCloseSidePanel}/>

            <StatisticsUsers path={siteRoot + 'sys/statistics/users/'} onCloseSidePanel={this.onCloseSidePanel} />
            <WebSettings path={siteRoot + 'sys/web-settings'} />

            <Users path={siteRoot + 'sys/users'} onCloseSidePanel={this.onCloseSidePanel} />
            <AdminUsers path={siteRoot + 'sys/users/admins'} onCloseSidePanel={this.onCloseSidePanel} />
            <User path={siteRoot + 'sys/users/:email'} onCloseSidePanel={this.onCloseSidePanel} />
            <UserGroups path={siteRoot + 'sys/users/:email/groups'} onCloseSidePanel={this.onCloseSidePanel} />
            <SearchUsers path={siteRoot + 'sys/search-users'} onCloseSidePanel={this.onCloseSidePanel} />
            <WorkWeixinDepartments
              path={siteRoot + 'sys/work-weixin'}
              currentTab={currentTab}
              tabItemClick={this.tabItemClick}
              onCloseSidePanel={this.onCloseSidePanel}
            />
            <Groups path={siteRoot + 'sys/groups'} onCloseSidePanel={this.onCloseSidePanel} />
            <GroupDTables path={siteRoot + 'sys/groups/:groupID/dtables'} onCloseSidePanel={this.onCloseSidePanel} />
            <GroupMembers path={siteRoot + 'sys/groups/:groupID/members'} onCloseSidePanel={this.onCloseSidePanel} />
            <GroupStorages path={siteRoot + 'sys/groups/:groupID/storages/*'} onCloseSidePanel={this.onCloseSidePanel}  />

            <ExternalLinks path={siteRoot + 'sys/external-links'} onCloseSidePanel={this.onCloseSidePanel} />

            <SearchGroups path={siteRoot+'sys/search-groups'} onCloseSidePanel={this.onCloseSidePanel}/>

            <Notifications path={siteRoot + 'sys/notifications'} onCloseSidePanel={this.onCloseSidePanel} />
            <AdminOperationLogs path={siteRoot + 'sys/admin-logs/operation'} onCloseSidePanel={this.onCloseSidePanel} />
            <AdminLoginLogs path={siteRoot + 'sys/admin-logs/login'} onCloseSidePanel={this.onCloseSidePanel} />
          </Router>

        </MainPanel>
        <MediaQuery query="(max-width: 767.8px)">
          <Modal isOpen={!isSidePanelClosed} toggle={this.onCloseSidePanel} contentClassName="d-none"></Modal>
        </MediaQuery>
      </div>
    );
  }
}

ReactDOM.render(
  <SysAdmin />,
  document.getElementById('wrapper')
);
