import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import Rename from '../../components/rename';
import DTableIODialog from './dialog/dtable-io-dialog';
import { Utils } from '../../utils/utils';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import toaster from '../../components/toast';
// import DTableWebAPI from '../../utils/api';

const gettext = window.gettext;
const siteRoot = window.app.config.siteRoot;

const propTypes = {
  isItemFreezed: PropTypes.bool.isRequired,
  table: PropTypes.object.isRequired,
  renameTable: PropTypes.func.isRequired,
  onDeleteTableToggle: PropTypes.func.isRequired,
  onShareTableToggle: PropTypes.func.isRequired,
  onTableSnapshotsToggle: PropTypes.func.isRequired,
  onTableAPITokenToggle: PropTypes.func.isRequired,
  onFreezedItem: PropTypes.func.isRequired,
  onUnfreezedItem: PropTypes.func.isRequired,
  onSeafileConnectorToggle: PropTypes.func.isRequired,
  onCopyDTableToggle: PropTypes.func.isRequired,
  onAssetManageToggle: PropTypes.func.isRequired,
  isOwner: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onAddStarDTable: PropTypes.func.isRequired,
  onUnstarDTable: PropTypes.func.isRequired,
};

class DTableItemCommon extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isTableRenaming: false,
      dropdownOpen: false,
      active: false,
      isShowDTableIODialog: false,
      IOTaskId: 0,
      currentExportingTable: null,
    };
  }

  onMouseEnter = () => {
    if (!this.props.isItemFreezed) {
      this.setState({active: true});
    }
  }

  onMouseLeave = () => {
    if (!this.props.isItemFreezed) {
      this.setState({active: false});
    }
  }

  onRenameTableConfirm = (newTableName) => {
    let oldTableName = this.props.table.name;
    this.props.renameTable(oldTableName, newTableName);
    this.onRenameTableToggle();
  }

  onRenameTableToggle = () => {
    this.setState({isTableRenaming: !this.state.isTableRenaming, active: false});
    this.props.onUnfreezedItem();
  }

  onDeleteTableToggle = () => {
    this.props.onDeleteTableToggle(this.props.table);
  }

  onShareTableToggle = () => {
    this.props.onShareTableToggle(this.props.table);
  }

  onTableSnapshotsToggle = () => {
    this.props.onTableSnapshotsToggle(this.props.table);
  }

  onDTableIODialogToggle = () => {
    this.setState({isShowDTableIODialog: !this.state.isShowDTableIODialog});
  }

  exportDTable = () => {
    let task_id = '';
    dtableWebAPI.addExportDTableTask(this.props.table.workspace_id, this.props.table.name).then(res => {
      task_id = res.data.task_id;
      this.setState({
        isShowDTableIODialog: true,
        IOTaskId: task_id,
        currentExportingTable: res.data.table,
      });
      return dtableWebAPI.queryDTableIOStatusByTaskId(task_id);
    }).then(res => {
      if (res.data.is_finished === true) {
        this.setState({isShowDTableIODialog: false});
        location.href = siteRoot + 'api/v2.1/dtable-export-content/?task_id=' + task_id + '&dtable_uuid=' + this.props.table.uuid;
      } else {
        this.timer = setInterval(() => {
          dtableWebAPI.queryDTableIOStatusByTaskId(task_id).then(res => {
            if (res.data.is_finished === true) {
              clearInterval(this.timer);
              this.setState({isShowDTableIODialog: false});
              location.href = siteRoot + 'api/v2.1/dtable-export-content/?task_id=' + task_id + '&dtable_uuid=' + this.props.table.uuid;
            }
          }).catch(error => {
            clearInterval(this.timer);
            this.setState({isShowDTableIODialog: false});
            toaster.danger(gettext('Failed to export. Please check whether the size of table attachments exceeds the limit.'));
          });
        }, 1000);
      }
    }).catch(error => {
      if (error.response.status === 500) {
        toaster.danger(gettext('Server is busy. Please try again later.'));
      } else {
        let errMessage = Utils.getErrorMsg(error);
        toaster.danger(errMessage);
      }
    });
  }

  cancelDTableIOTask = () => {
    clearInterval(this.timer);
    let dtable_uuid = this.state.currentExportingTable.uuid;
    dtableWebAPI.cancelDTableIOTask(this.state.IOTaskId, dtable_uuid, 'export').then(res => {
      this.setState({
        isShowDTableIODialog: false,
        IOTaskId: 0,
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  onTableAPITokenToggle = () => {
    this.props.onTableAPITokenToggle(this.props.table);
  }

  onCopyDTableToggle = () => {
    this.props.onCopyDTableToggle(this.props.table);
  }

  onSeafileConnectorToggle = () => {
    this.props.onSeafileConnectorToggle(this.props.table);
  }

  onAssetManageToggle = () => {
    this.props.onAssetManageToggle(this.props.table);
  }

  dropdownToggle = () => {
    if (this.state.dropdownOpen) {
      this.setState({ active: false });
      this.props.onUnfreezedItem();
    } else {
      this.props.onFreezedItem();
    }
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  }

  onAddStarDTable = () => {
    let { table } = this.props;
    this.props.onAddStarDTable(table.uuid);
  }

  onUnstarDTable = () => {
    let { table } = this.props;
    this.props.onUnstarDTable(table.uuid);
  }

  render() {
    let { isOwner, isAdmin } = this.props;

    let table = this.props.table;
    let tableHref = siteRoot + 'workspace/' + table.workspace_id + '/dtable/' + table.name + '/';
    const isDesktop = Utils.isDesktop();
    if (!isDesktop) {
      return (
        <div className="table-mobile-item">
          <div className="table-mobile-icon"><span className="dtable-font dtable-icon-table"></span></div>
          <div className="table-mobile-name">
            {this.state.isTableRenaming && (
              <Rename
                hasSuffix={true}
                name={table.name}
                onRenameConfirm={this.onRenameTableConfirm}
                onRenameCancel={this.onRenameTableToggle}
              />
            )}
            {!this.state.isTableRenaming && <a href={tableHref}>{table.name}</a>}
          </div>
          <div className="table-mobile-dropdown-menu">
            <Dropdown isOpen={this.state.dropdownOpen} toggle={this.dropdownToggle} direction="down" className="table-item-more-operation">
              <DropdownToggle
                tag='i'
                className='dtable-font dtable-icon-more-vertical table-dropdown-menu-icon'
                title={gettext('More Operations')}
                data-toggle="dropdown"
                aria-expanded={this.state.dropdownOpen}
              >
              </DropdownToggle>
              <div className={this.state.dropdownOpen ? '' : 'd-none'} onClick={this.dropdownToggle}>
                <div className="mobile-operation-menu-bg-layer"></div>
                <div className="mobile-operation-menu">
                  {(isOwner || isAdmin) &&
                    <Fragment>
                      <DropdownItem onClick={this.onShareTableToggle} className="mobile-dropdown-item">
                        <span className="dtable-font dtable-icon-share"></span>
                        <span className="mobile-dropdown-span">{gettext('Share')}</span>
                      </DropdownItem>
                      <DropdownItem onClick={this.onRenameTableToggle} className="mobile-dropdown-item">
                        <span className="dtable-font dtable-icon-rename"></span>
                        <span className="mobile-dropdown-span">{gettext('Rename')}</span>
                      </DropdownItem>
                      <DropdownItem onClick={this.onDeleteTableToggle} className="mobile-dropdown-item">
                        <span className="dtable-font dtable-icon-delete"></span>
                        <span className="mobile-dropdown-span">{gettext('Delete')}</span>
                      </DropdownItem>
                      <DropdownItem divider />
                    </Fragment>
                  }
                  <DropdownItem onClick={this.onCopyDTableToggle} className="mobile-dropdown-item">
                    <span className="dtable-font dtable-icon-copy"></span>
                    <span className="mobile-dropdown-span">{gettext('Copy')}</span>
                  </DropdownItem>
                  <DropdownItem onClick={this.exportDTable} className="mobile-dropdown-item">
                    <span className="dtable-font dtable-icon-export"></span>
                    <span className="mobile-dropdown-span">{gettext('Export')}</span>
                  </DropdownItem>
                  <DropdownItem divider />
                  {(isOwner || isAdmin) &&
                  <DropdownItem onClick={this.onTableAPITokenToggle} className="mobile-dropdown-item">
                    <span className="dtable-font dtable-icon-token"></span>
                    <span className="mobile-dropdown-span">{gettext('API Token')}</span>
                  </DropdownItem>
                  }
                  <DropdownItem onClick={this.onTableSnapshotsToggle} className="mobile-dropdown-item">
                    <span className="dtable-font dtable-icon-history-mirror-image"></span>
                    <span className="mobile-dropdown-span">{gettext('Snapshots')}</span>
                  </DropdownItem>
                </div>
              </div>
            </Dropdown>
          </div>
          {this.state.isShowDTableIODialog && (
            <DTableIODialog
              isExporting={true}
              toggle={this.onDTableIODialogToggle}
              cancelDTableIOTask={this.cancelDTableIOTask}
            />
          )}
        </div>
      );
    }
    return (
      <div onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} className={`table-item ${this.state.active ? 'tr-highlight' : ''}`}>
        <div className="table-icon"><span className="dtable-font dtable-icon-table dtable-icon-style"></span></div>
        <div className="table-name">
          {this.state.isTableRenaming && (
            <Rename
              hasSuffix={true}
              name={table.name}
              onRenameConfirm={this.onRenameTableConfirm}
              onRenameCancel={this.onRenameTableToggle}
            />
          )}
          {!this.state.isTableRenaming && (
            <Fragment>
              <a href={tableHref}>{table.name}</a>{table.starred && <span className='dtable-font dtable-icon-star star'/>}
            </Fragment>
          )}
        </div>
        <div className="table-dropdown-menu">
          {this.state.active && (
            <Dropdown isOpen={this.state.dropdownOpen} toggle={this.dropdownToggle} direction="down" className="table-item-more-operation">
              <DropdownToggle
                tag='i'
                className='dtable-font dtable-icon-more-vertical cursor-pointer attr-action-icon table-dropdown-menu-icon'
                title={gettext('More Operations')}
                data-toggle="dropdown"
                aria-expanded={this.state.dropdownOpen}
              >
              </DropdownToggle>
              <DropdownMenu className="drop-list" right={true}>
                {(isOwner || isAdmin) && <DropdownItem onClick={this.onShareTableToggle}>{gettext('Share')}</DropdownItem>}
                {(isOwner || isAdmin) && <DropdownItem onClick={this.onRenameTableToggle}>{gettext('Rename')}</DropdownItem>}
                {!table.starred && <DropdownItem onClick={this.onAddStarDTable}>{gettext('Star')}</DropdownItem>}
                {table.starred && <DropdownItem onClick={this.onUnstarDTable}>{gettext('Unstar')}</DropdownItem>}
                {(isOwner || isAdmin) && <DropdownItem onClick={this.onDeleteTableToggle}>{gettext('Delete')}</DropdownItem>}
                <DropdownItem divider />
                <DropdownItem onClick={this.onCopyDTableToggle}>{gettext('Copy')}</DropdownItem>
                <DropdownItem onClick={this.exportDTable}>{gettext('Export')}</DropdownItem>
                <DropdownItem divider />
                {(isOwner || isAdmin) && <DropdownItem onClick={this.onTableAPITokenToggle}>{gettext('API Token')}</DropdownItem>}
                <DropdownItem onClick={this.onTableSnapshotsToggle}>{gettext('Snapshots')}</DropdownItem>
                {(isOwner || isAdmin) &&
                  <Fragment>
                    <DropdownItem onClick={this.onSeafileConnectorToggle}>{gettext('Connect Seafile')}</DropdownItem>
                  </Fragment>
                }
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
        {this.state.isShowDTableIODialog && (
          <DTableIODialog
            isExporting={true}
            toggle={this.onDTableIODialogToggle}
            cancelDTableIOTask={this.cancelDTableIOTask}
          />
        )}
      </div>
    );
  }
}

DTableItemCommon.propTypes = propTypes;

export default DTableItemCommon;

