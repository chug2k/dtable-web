import React from 'react';
import PropTypes from 'prop-types';
import { Router } from '@reach/router';
import Account from '../../components/common/account';
import Notification from '../../components/common/notification';
import SearchDtable from './search/search-dtable';
import MainPanelDTables from './main-panel-dtables';
import MainPanelDataset from './main-panel-dataset';
import MainPanelApps from './main-panel-apps';
import MainPanelTempletes from './main-panel-templetes';
import MainPanelForms  from './main-panel-forms';
import MainPanelActivities from './main-panel-activities';
import DtableMenuToolbar from './toolbar/dtable-menu-toolbar';
import { Utils } from '../../utils/utils';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import Workspace from './model/workspace';
import { cloudMode, isOrgContext } from '../../utils/constants';

import '../../css/dtable-search.css';

const siteRoot = window.app.config.siteRoot;
const gettext = window.gettext;

const propTypes = {
  onShowSidePanel: PropTypes.func.isRequired,
  searchPlaceholder: PropTypes.string
};

class MainPanel extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      errorMsg: null,
      sharedTableList: [],
      workspaceList: [],
      isWorkspaceListLoading: true,
      isSharedTableListLoading: true,
    };
  }

  onSearchedClick = (item) => {
    let url = siteRoot + 'workspace/' + item.workspace_id + '/dtable/' + item.name + '/';
    location.href = url;
  }

  loadWorkspaceList = () => {
    dtableWebAPI.listWorkspaces().then((res) => {
      let workspaceList = res.data.workspace_list.map(item => {
        return new Workspace(item);
      });
      this.setState({
        isWorkspaceListLoading: false,
        workspaceList: workspaceList,
      });
      return dtableWebAPI.listGroupSharedTables();
    }).then((res) => {
      let groupSharedDTables = res.data.group_shared_dtables;
      let workspaceList = this.state.workspaceList.slice();
      workspaceList.map((item) => {
        if (item.owner_type === 'Group' && item.group_id in groupSharedDTables) {
          item.group_shared_tables.push(...groupSharedDTables[item.group_id]);
        }
        return item;
      });
      this.setState({workspaceList: workspaceList});
    }).catch((error) => {
      this.errorCallbackHandle(error);
    });
  }

  loadSharedTableList = () => {
    dtableWebAPI.listSharedTables().then((res) => {
      this.setState({
        isSharedTableListLoading: false,
        sharedTableList: res.data.table_list,
      });
    }).catch((error) => {
      this.errorCallbackHandle(error);
    });
  }

  errorCallbackHandle = (error) => {
    if (error.response) {
      this.setState({
        errorMsg: gettext('Error')
      });
    } else {
      this.setState({
        errorMsg: gettext('Please check the network.')
      });
    }
  }

  onDeleteGroup = (groupID) => {
    let workspaceList = this.state.workspaceList.filter((item) => item.group_id !== groupID);
    this.setState({workspaceList: workspaceList});
  }

  onCopyDTable = (dtable) => {
    let newWorkspaceList = this.state.workspaceList.slice();
    for (let workspace of newWorkspaceList) {
      if (dtable.workspace_id === workspace.id) {
        workspace.table_list.push(dtable);
        break;
      }
    }
    this.setState({workspaceList: newWorkspaceList});
  }

  onDeleteTable = (deletedWorkspaceID, newTableList) => {
    let workspaceList = this.state.workspaceList.slice(0);
    for (let i = 0; i < workspaceList.length; i++) {
      if (workspaceList[i].id === deletedWorkspaceID) {
        workspaceList[i].table_list = newTableList;
        break;
      }
    }
    this.setState({workspaceList});
  }

  onAddGroupSharedTable = (groupID, table) => {
    let workspaceList = this.state.workspaceList.slice();
    for (let workspace of workspaceList) {
      if (workspace.group_id === groupID) {
        workspace.group_shared_tables.push(table);
        break;
      }
    }
    this.setState({workspaceList: workspaceList});
  }

  onLeaveGroupSharedTable = (groupID, table) => {
    let workspaceList = this.state.workspaceList.slice(0);
    for (let i = 0; i < workspaceList.length; i++) {
      if (workspaceList[i].group_id === groupID) {
        workspaceList[i].group_shared_tables = workspaceList[i].group_shared_tables.filter((item) => {return item.id !== table.id;});
        break;
      }
    }
    this.setState({workspaceList: workspaceList});
  }

  render() {

    let searchPlaceholder = this.props.searchPlaceholder || gettext('Search bases');
    const isDesktop = Utils.isDesktop();

    return (
      <div className="main-panel">
        <div className="main-panel-north dtable-header">
          {!isDesktop && 
            <DtableMenuToolbar 
              onShowSidePanel={this.props.onShowSidePanel}
              loadWorkspaceList={this.loadWorkspaceList}
            />
          }
          <div className="common-toolbar">
            <SearchDtable
              placeholder={searchPlaceholder}
              onSearchedClick={this.onSearchedClick}
            />
            <Notification />
            <Account />
          </div>
        </div>
        <Router className="reach-router">
          <MainPanelDTables 
            path={siteRoot} 
            loadWorkspaceList={this.loadWorkspaceList}
            loadSharedTableList={this.loadSharedTableList}
            isSharedTableListLoading={this.state.isSharedTableListLoading}
            isWorkspaceListLoading={this.state.isWorkspaceListLoading}
            sharedTableList={this.state.sharedTableList}
            workspaceList={this.state.workspaceList}
            errorMsg={this.state.errorMsg}
            onDeleteGroup={this.onDeleteGroup}
            onDeleteTable={this.onDeleteTable}
            onCopyDTable={this.onCopyDTable}
            onAddGroupSharedTable={this.onAddGroupSharedTable}
            onLeaveGroupSharedTable={this.onLeaveGroupSharedTable}
          />
          <MainPanelDTables 
            path={siteRoot + 'dtable/'}
            loadWorkspaceList={this.loadWorkspaceList}
            loadSharedTableList={this.loadSharedTableList}
            isSharedTableListLoading={this.state.isSharedTableListLoading}
            isWorkspaceListLoading={this.state.isWorkspaceListLoading}
            sharedTableList={this.state.sharedTableList}
            workspaceList={this.state.workspaceList}
            errorMsg={this.state.errorMsg}
            onDeleteGroup={this.onDeleteGroup}
            onDeleteTable={this.onDeleteTable}
            onCopyDTable={this.onCopyDTable}
            onAddGroupSharedTable={this.onAddGroupSharedTable}
            onLeaveGroupSharedTable={this.onLeaveGroupSharedTable}
          />
          {(!cloudMode || isOrgContext) && <MainPanelForms path={siteRoot + 'forms/'} />}
          <MainPanelActivities path={siteRoot + 'activities/'} />
          {(!cloudMode || isOrgContext) && <MainPanelDataset path={siteRoot + 'common-datasets/'} loadWorkspaceList={this.loadWorkspaceList}/>}
          <MainPanelApps path={siteRoot + 'dtable/apps/'} />
          <MainPanelTempletes path={siteRoot + 'dtable/templetes/'} />
        </Router>
      </div>
    );
  }
}

MainPanel.propTypes = propTypes;

export default MainPanel;
