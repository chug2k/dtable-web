import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import Loading from '../../components/loading';
import DTableItemCommon from './dtable-item-common';
import CreateTableDialog from './dialog/create-table-dialog';
import DeleteTableDialog from './dialog/delete-table-dialog';
import ShareTableDialog from './dialog/share-table-dialog';
import TableAPITokenDialog from './dialog/table-api-token-dialog';
import ManageMembersDialog from './dialog/manage-members-dialog';
import RenameGroupNameDialog from './dialog/rename-group-name-dialog';
import TableSnapshotsDialog from './dialog/table-snapshots-dialog';
import DTableIODialog from './dialog/dtable-io-dialog';
import DeleteGroupDialog from './dialog/delete-group-dialog';
import CopyDTableDialog from './dialog/copy-dtable-dialog';
import GroupDropdownMenu from './dtable-dropdown-menu/group-dropdown-menu';
import { Utils } from '../../utils/utils';
import { canAddDTable } from '../../utils/constants';
import SeafileConnectorDialog from '../../components/dialog/seafile-connector';
import AssetManageDialog from './dialog/asset-manage-dialog';
import toaster from '../../components/toast';
import DTableItemGroupShared from './dtable-item-group-shared';
import { dtableStore } from 'dtable-store';

const gettext = window.gettext;
const username = window.app.pageOptions.username;

const propTypes = {
  workspace: PropTypes.object.isRequired,
  renameGroupName: PropTypes.func,
  onDeleteGroup: PropTypes.func,
  onCopyDTable: PropTypes.func.isRequired,
  onDeleteTable: PropTypes.func.isRequired,
  onLeaveGroupSharedTable: PropTypes.func,
  onAddGroupSharedTable: PropTypes.func
};

class DTableWorkspaceCommon extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      tableList: [],
      isDataLoading: true,
      isItemFreezed: false,
      isShowCreateDialog: false,
      isShowDeleteDialog: false,
      isShowSharedDialog: false,
      isShowAPITokenDialog: false,
      isShowRenameTableDialog: false,
      isShowManageMembersDialog: false,
      isShowSeafileConnectorDialog: false,
      isShowTableSnapshotsDialog: false,
      isShowCopyDTable: false,
      isShowDTableIODialog: false,
      isShowAssetManageDialog: false,
      isOwner: false,
      isAdmin: false,
      currentTable: null,
      dtableImportPendingTable: null,
      IOTaskId: 0,
      canCancelIOTask: false,
    };
  }

  componentDidMount() {
    let workspace = this.props.workspace;
    let isPersonal = workspace.owner_type === 'Personal';
    let tableList = workspace.table_list;
    this.setState({
      tableList: tableList,
      isDataLoading: false,
    });
    if (isPersonal) {
      this.setState({ isOwner: true });
    } else {
      let isOwner = workspace.group_owner === username ? true : false;
      let isAdmin = workspace.group_admins.indexOf(username) > -1;
      this.setState({ isOwner, isAdmin });
    }
  }
  
  componentWillReceiveProps(nextProps) {
    if (nextProps.workspace !== this.props.workspace) {
      let workspace = nextProps.workspace;
      let tableList = workspace.table_list;
      this.setState({tableList: tableList});
    }
  }

  onFreezedItem = () => {
    this.setState({isItemFreezed: true});
  }

  onUnfreezedItem = () => {
    this.setState({isItemFreezed: false});
  }

  onCreateTableToggle = () => {
    this.setState({isShowCreateDialog: !this.state.isShowCreateDialog});
  }

  onDeleteTableToggle = (table) => {
    this.setState({
      isShowDeleteDialog: !this.state.isShowDeleteDialog,
      currentTable: table
    });
    this.onUnfreezedItem();
  }

  onDeleteTableSubmit = () => {
    let tableName = this.state.currentTable.name;
    this.deleteTable(tableName);
    this.onDeleteTableToggle();
  }
  
  onShareTableToggle = (table) => {
    this.setState({
      isShowSharedDialog: !this.state.isShowSharedDialog,
      currentTable: table
    });
    this.onUnfreezedItem();
  }

  onTableAPITokenToggle = (table) => {
    this.setState({
      isShowAPITokenDialog: !this.state.isShowAPITokenDialog,
      currentTable: table
    });
    this.onUnfreezedItem();
  }

  onDTableIODialogToggle = () => {
    this.setState({isShowDTableIODialog: !this.state.isShowDTableIODialog});
  }

  onCreateTable = (tableName, owner) => {
    dtableWebAPI.createTable(tableName, owner).then((res) => {
      this.state.tableList.push(res.data.table);
      this.setState({
        tableList: this.state.tableList
      });
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
      this.setState({errorMsg: gettext('Error')});
    });

    this.onCreateTableToggle();
  }

  uploadDTableFile = (workspaceId, file) => {
    let task_id = '';
    let table = {};
    if (file['type'] === 'text/csv') {
      this.setState({
        isShowDTableIODialog: true,
        canCancelIOTask: false,
      });
      dtableWebAPI.addImportDTableTask(workspaceId, file).then((res) => {
        task_id = res.data.task_id;
        table = res.data.table;
        this.state.tableList.push(res.data.table);
        this.setState({
          tableList: this.state.tableList,
          isShowDTableIODialog: false,
        });
        toaster.success(gettext('Successfully imported file.'));
      }).catch((error) => {
        if (error.response.status === 500) {
          toaster.danger(gettext('Server is busy. Please try again later.'));
        } else {
          let errMessage = Utils.getErrorMsg(error);
          toaster.danger(errMessage);
        }
      });
      this.onCreateTableToggle();
      return;
    }

    dtableWebAPI.addImportDTableTask(workspaceId, file).then((res) => {
      task_id = res.data.task_id;
      table = res.data.table;
      this.setState({
        isShowDTableIODialog: true,
        canCancelIOTask: true,
        IOTaskId: task_id,
        dtableImportPendingTable: table,
      });
      return dtableWebAPI.queryDTableIOStatusByTaskId(task_id);
    }).then(res => {
      this.timer = setInterval(() => {
        dtableWebAPI.queryDTableIOStatusByTaskId(task_id).then(res => {
          if (res.data.is_finished === true) {
            clearInterval(this.timer);
            this.state.tableList.push(table);
            this.setState({
              tableList: this.state.tableList,
              isShowDTableIODialog: false,
            });
            toaster.success(gettext('Successfully imported file.'));
          }
        });
      }, 1000);
    }).catch((error) => {
      if (error.response.status === 500) {
        toaster.danger(gettext('Server is busy. Please try again later.'));
      } else {
        let errMessage = Utils.getErrorMsg(error);
        toaster.danger(errMessage);
      }
    });
    this.onCreateTableToggle();
  }

  cancelDTableIOTask = () => {
    clearInterval(this.timer);
    let dtable_uuid = this.state.dtableImportPendingTable.uuid;
    dtableWebAPI.cancelDTableIOTask(this.state.IOTaskId, dtable_uuid, 'import').then(res => {
      this.setState({
        isShowDTableIODialog: false,
        IOTaskId: 0,
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  deleteTable = (tableName) => {
    let workspaceID = this.props.workspace.id;
    dtableWebAPI.deleteTable(workspaceID, tableName).then(() => {
      let tableList = this.state.tableList.filter(table => {
        return table.name !== tableName;
      });
      this.setState({tableList: tableList});
      this.props.onDeleteTable(workspaceID, tableList);
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
      this.setState({errorMsg: gettext('Error')});
    });
  }

  renameTable = (oldTableName, newTableName) => {
    let workspaceID = this.props.workspace.id;
    dtableWebAPI.renameTable(workspaceID, oldTableName, newTableName).then((res) => {
      let tableList = this.state.tableList.map((table) => {
        if (table.name === oldTableName) {
          table = res.data.table;
        }
        return table;
      });
      this.setState({tableList: tableList});
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
      this.setState({errorMsg: gettext('Error')});
    });
  }

  onCopyDTableToggle = (table) => {
    this.setState({
      isShowCopyDTable: !this.state.isShowCopyDTable,
      currentTable: table
    });
    this.onUnfreezedItem();
  }

  copyDTable = (dtable, dstWorkspace) => {
    toaster.notify(gettext('It may take some time, please wait.'));
    dtableWebAPI.copyDTable(dtable.workspace_id, dstWorkspace.id, dtable.name).then((res) => {
      this.onCopyDTableToggle(dtable);
      this.props.onCopyDTable(res.data.dtable);
      toaster.success(gettext('Successfully copy {name}').replace('{name}', res.data.dtable.name));
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error, true);
      toaster.danger(errMsg);
      this.onCopyDTableToggle(dtable);
    });
  }

  toggleManageMembersDialog = () => {
    this.setState({
      isShowManageMembersDialog: !this.state.isShowManageMembersDialog
    });
  }

  onDtableManageMembers = () => {
    dtableWebAPI.getGroup(this.props.workspace.group_id).catch(error => {
      if (error.response) {
        this.setState({errorMsg: gettext('Error')});
      }
    });
  }

  onRenameDtableGroupToggle = () => {
    this.setState({
      isShowRenameTableDialog: !this.state.isShowRenameTableDialog
    });
  }

  onTableSnapshotsToggle = (table) => {
    this.setState({
      isShowTableSnapshotsDialog: !this.state.isShowTableSnapshotsDialog,
      currentTable: table,
    });
  }

  onSeafileConnectorToggle = (table) => {
    this.setState({
      isShowSeafileConnectorDialog: !this.state.isShowSeafileConnectorDialog,
      currentTable: table
    });
    this.onUnfreezedItem();
  }

  onDeleteGroupToggle = () => {
    this.setState({
      isShowDeleteGroupDialog: !this.state.isShowDeleteGroupDialog
    });
    this.onUnfreezedItem();
  }

  onDeleteGroupSubmit = () => {
    this.onDeleteGroup();
    this.onDeleteGroupToggle();
  }

  onDeleteGroup = () => {
    let groupID = this.props.workspace.group_id;
    if (groupID && this.state.tableList.length > 0) {
      toaster.danger(gettext('Disable group deletion before deleting table(s)'));
      return;
    }
    dtableWebAPI.deleteGroup(groupID).then(() => {
      toaster.success(gettext('Delete Successfully'));
      this.props.onDeleteGroup(groupID);
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  onAssetManageToggle = (table) => {
    this.setState({
      isShowAssetManageDialog: !this.state.isShowAssetManageDialog,
      currentTable: table
    });
    this.onUnfreezedItem();
  }

  onLeaveGroupSharedTable = (table) => {
    let { workspace } = this.props;
    dtableWebAPI.deleteTableGroupShare(table.workspace_id, table.name, workspace.group_id).then(() => {
      this.props.onLeaveGroupSharedTable(workspace.group_id, table);
    }).catch((error) => {
      if (error.response && error.response.status === 404) {
        this.props.onLeaveGroupSharedTable(workspace.group_id, table);
      } else {
        let errMessage = Utils.getErrorMsg(error);
        toaster.danger(errMessage);
      }
    });
  }

  onAddStarDTable = (dtable_uuid, isGroup) => {
    dtableWebAPI.addStarDTable(dtable_uuid).then(() => {
      if (!isGroup) {
        let tableList = this.state.tableList;
        tableList = tableList.map((item) => {
          if (item.uuid === dtable_uuid) {
            item.starred = true;
          }
          return item;
        });
        this.setState({tableList: tableList});
      } else {
        let { workspace } = this.props;
        let groupSharedTables = workspace.group_shared_tables.slice();
        groupSharedTables = groupSharedTables.map((item) => {
          if (item.uuid === dtable_uuid) {
            item.starred = true;
          }
          return item;
        });
        workspace.group_shared_tables = groupSharedTables;
        this.setState({workspace: workspace});
      }
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  onUnstarDTable = (dtable_uuid, isGroup) => {
    dtableWebAPI.unstarDTable(dtable_uuid).then(() => {
      if (!isGroup) {
        let tableList = this.state.tableList.slice();
        tableList = tableList.map((item) => {
          if (item.uuid === dtable_uuid) {
            item.starred = false;
          }
          return item;
        });
        this.setState({tableList: tableList});
      } else {
        let { workspace } = this.props;
        let groupSharedTables = workspace.group_shared_tables.slice();
        groupSharedTables = groupSharedTables.map((item) => {
          if (item.uuid === dtable_uuid) {
            item.starred = false;
          }
          return item;
        });
        workspace.group_shared_tables = groupSharedTables;
        this.setState({workspace: workspace});
      }
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  renderAddTableItem = () => {
    const isDesktop = Utils.isDesktop();
    let { isItemFreezed } = this.state;
    if (isDesktop) {
      return (
        <div className={`table-item ${isItemFreezed ? '' : 'add-table-range'}`}>
          <div className="table-icon"><span className="dtable-font dtable-icon-add-line dtable-icon-style"></span></div>
          <div className="table-name"><span className="a-simulate" onClick={this.onCreateTableToggle}>{gettext('Add a base')}</span></div>
          <div className="table-dropdown-menu"></div>
        </div>
      );
    }
    return (
      <div className={`table-mobile-item ${isItemFreezed ? '' : 'add-table-range'}`}>
        <div className="table-mobile-icon"><span className="dtable-font dtable-icon-add-line"></span></div>
        <div className="table-mobile-name"><span className="a-simulate" onClick={this.onCreateTableToggle}>{gettext('Add a base')}</span></div>
        <div className="table-mobile-dropdown-menu"></div>
      </div>
    );
  }

  render() {
    let { workspace } = this.props;
    let groupSharedTables = workspace.group_shared_tables;
    let isPersonal = workspace.owner_type === 'Personal';
    let { tableList, isItemFreezed, isDataLoading, isOwner, isAdmin } = this.state;
    if (isDataLoading) {
      return <Loading />;
    }

    const isDesktop = Utils.isDesktop();

    return (
      <Fragment>
        <div className="workspace">
          <div className={`${isDesktop ? '' : 'table-mobile-padding ' } table-heading`}>
            <span>{isPersonal ? gettext('My Tables') : workspace.owner_name}</span>
            {!isPersonal && (isOwner || isAdmin) &&
              <GroupDropdownMenu
                onRenameDtableGroup={this.onRenameDtableGroupToggle}
                onManageMembersToggle={this.toggleManageMembersDialog}
                onDtableManageMembers={this.onDtableManageMembers}
                onDeleteGroupToggle={this.onDeleteGroupToggle}
                isOwner={isOwner}
                workspace={workspace}
              />
            }
          </div>
          <div className={`${isDesktop ? 'table-item-container' : 'table-mobile-item-container'}`}>
            {tableList.map((table, index) => {
              return (
                <DTableItemCommon
                  key={index}
                  table={table}
                  isItemFreezed={isItemFreezed}
                  renameTable={this.renameTable}
                  onShareTableToggle={this.onShareTableToggle}
                  onDeleteTableToggle={this.onDeleteTableToggle}
                  onTableAPITokenToggle={this.onTableAPITokenToggle}
                  onFreezedItem={this.onFreezedItem}
                  onUnfreezedItem={this.onUnfreezedItem}
                  onSeafileConnectorToggle={this.onSeafileConnectorToggle}
                  onTableSnapshotsToggle={this.onTableSnapshotsToggle}
                  onCopyDTableToggle={this.onCopyDTableToggle}
                  onAssetManageToggle={this.onAssetManageToggle}
                  isOwner={isOwner}
                  isAdmin={isAdmin}
                  onAddStarDTable={this.onAddStarDTable}
                  onUnstarDTable={this.onUnstarDTable}
                />
              );
            })}
            {groupSharedTables.map((table, index) => {
              return (
                <DTableItemGroupShared 
                  key={index}
                  table={table}
                  isItemFreezed={isItemFreezed}
                  isAdmin={isAdmin}
                  onLeaveGroupSharedTable={this.onLeaveGroupSharedTable}
                  onFreezedItem={this.onFreezedItem}
                  onUnfreezedItem={this.onUnfreezedItem}
                  onAddStarDTable={this.onAddStarDTable}
                  onUnstarDTable={this.onUnstarDTable}
                />
              );
            })}
            {canAddDTable && (isPersonal || isOwner || isAdmin) && this.renderAddTableItem()}
          </div>
        </div>
        {this.state.isShowCreateDialog && (
          <CreateTableDialog
            createDTable={this.onCreateTable}
            onAddDTable={this.onCreateTableToggle}
            uploadDTableFile={this.uploadDTableFile}
            currentWorkspace={this.props.workspace}
          />
        )}
        {this.state.isShowDeleteDialog && (
          <DeleteTableDialog 
            currentTable={this.state.currentTable} 
            deleteCancel={this.onDeleteTableToggle} 
            handleSubmit={this.onDeleteTableSubmit} 
          />
        )}
        {this.state.isShowSharedDialog &&
          <ShareTableDialog 
            currentTable={this.state.currentTable} 
            shareCancel={this.onShareTableToggle} 
            onAddGroupSharedTable={this.props.onAddGroupSharedTable}
            onLeaveGroupSharedTable={this.props.onLeaveGroupSharedTable}
          />
        }
        {this.state.isShowAPITokenDialog &&
          <TableAPITokenDialog
            currentTable={this.state.currentTable}
            onTableAPITokenToggle={this.onTableAPITokenToggle}
          />
        }
        {this.state.isShowRenameTableDialog &&
          <RenameGroupNameDialog 
            onRenameDtableGroupToggle={this.onRenameDtableGroupToggle}
            currentGroupName={workspace.owner_name}
            groupID={workspace.group_id}
            renameGroupName={this.props.renameGroupName}
          />
        }
        {this.state.isShowManageMembersDialog && 
          <ManageMembersDialog 
            groupID={workspace.group_id}
            toggleManageMembersDialog={this.toggleManageMembersDialog}
            isOwner={this.state.isOwner}
          />
        }
        {this.state.isShowSeafileConnectorDialog &&
          <SeafileConnectorDialog
            dtable={this.state.currentTable}
            toggleCancel={this.onSeafileConnectorToggle}
          />
        }
        {this.state.isShowTableSnapshotsDialog && (
          <TableSnapshotsDialog 
            workspace={this.props.workspace}
            dtable={this.state.currentTable}
            toggleCancel={this.onTableSnapshotsToggle}
          />
        )}
        {this.state.isShowDeleteGroupDialog && (
          <DeleteGroupDialog 
            currentWorkspace={this.props.workspace}
            deleteCancel={this.onDeleteGroupToggle}
            handleSubmit={this.onDeleteGroupSubmit}
            workspace={this.props.workspace}
          />
        )}
        {this.state.isShowCopyDTable && (
          <CopyDTableDialog
            dtable={this.state.currentTable}
            copyCancel={this.onCopyDTableToggle}
            copyDTable={this.copyDTable}
          />
        )}
        {this.state.isShowDTableIODialog && (
          <DTableIODialog
            isExporting={false}
            toggle={this.onDTableIODialogToggle}
            cancelDTableIOTask={this.cancelDTableIOTask}
            canCancelIOTask={this.state.canCancelIOTask}
          />
        )}
        {this.state.isShowAssetManageDialog && (
          <AssetManageDialog 
            table={this.state.currentTable}
            onAssetManageToggle={this.onAssetManageToggle}
          />
        )}
      </Fragment>
    );
  }
}


DTableWorkspaceCommon.propTypes = propTypes;

export default DTableWorkspaceCommon;
