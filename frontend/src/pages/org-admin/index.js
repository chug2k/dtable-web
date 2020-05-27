// Import React!
import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from '@reach/router';
import moment from 'moment';
import { siteRoot, lang } from '../../utils/constants';
import SidePanel from './side-panel';
import OrgUsers from './org-users';
import OrgUserProfile from './org-user-profile';
import OrgGroups from './org-groups';
import OrgGroupInfo from './org-group-info';
import OrgGroupMembers from './org-group-members';
import OrgInfo from './org-info';
import OrgDepartments from './org-departments';
import OrgDepartmentsList from './org-departments-list';
import OrgDepartmentItem from './org-department-item';
import OrgDTables from './org-dtables';

import '../../css/layout.css';
import '../../css/toolbar.css';

moment.locale(lang);

class Org extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSidePanelClosed: false,
      currentTab: 'users',
    };
  }

  componentDidMount() {
    let href = window.location.href.split('/');
    let currentTab = href[href.length - 2];

    if (location.href.indexOf(`${siteRoot}org/useradmin`) !== -1) {
      currentTab = 'users';
    }
    if (location.href.indexOf(`${siteRoot}org/groupadmin`) !== -1) {
      currentTab = 'groupadmin';
    }
    if (location.href.indexOf(`${siteRoot}org/departmentadmin`) !== -1) {
      currentTab = 'departmentadmin';
    }
    if (location.href.indexOf(`${siteRoot}org/dtableadmin`) !== -1) {
      currentTab = 'tables';
    }
    this.setState({currentTab: currentTab});
  }

  onCloseSidePanel = () => {
    this.setState({isSidePanelClosed: !this.state.isSidePanelClosed});
  }

  tabItemClick = (param) => {
    this.setState({currentTab: param});          
  }

  render() {
    let { isSidePanelClosed, currentTab } = this.state;
    return (
      <div id="main">
        <SidePanel isSidePanelClosed={isSidePanelClosed} onCloseSidePanel={this.onCloseSidePanel} currentTab={currentTab} tabItemClick={this.tabItemClick}/>       
        <div className="main-panel o-hidden">
          <Router className="reach-router">
            <OrgInfo path={siteRoot + 'org/orgmanage'}/>
            <OrgUsers path={siteRoot + 'org/useradmin'} currentTab={currentTab} tabItemClick={this.tabItemClick}/>
            <OrgUserProfile path={siteRoot + 'org/useradmin/info/:email/'} />
            <OrgGroups path={siteRoot + 'org/groupadmin'} />
            <OrgGroupInfo path={siteRoot + 'org/groupadmin/:groupID/'} />
            <OrgGroupMembers path={siteRoot + 'org/groupadmin/:groupID/members/'} />
            <OrgDepartments path={siteRoot + 'org/departmentadmin'}>
              <OrgDepartmentsList path='/'/>
              <OrgDepartmentItem path='groups/:groupID'/>
            </OrgDepartments>
            <OrgDTables path={siteRoot + 'org/dtableadmin'} currentTab={currentTab} tabItemClick={this.tabItemClick}/>
          </Router>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <Org />,
  document.getElementById('wrapper')
);
