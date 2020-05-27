import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Loading from '../../components/loading';
import { gettext, canAddGroup, isOrgContext, orgName } from '../../utils/constants';
import DTableWorkspaceCommon from './dtable-workspace-common';
import DTableWorkspaceShared from './dtable-workspace-shared';
import CreateDtableGroupDialog from './dialog/create-dtable-group-dialog';
import { Utils } from '../../utils/utils';

const propTypes = {
  workspaceList: PropTypes.array.isRequired,
  sharedTableList: PropTypes.array.isRequired,
  isWorkspaceListLoading: PropTypes.bool.isRequired,
  isSharedTableListLoading: PropTypes.bool.isRequired,
  loadWorkspaceList: PropTypes.func.isRequired,
  loadSharedTableList: PropTypes.func.isRequired,
  onDeleteGroup: PropTypes.func.isRequired,
  errorMsg: PropTypes.string,
  onCopyDTable: PropTypes.func.isRequired,
  onDeleteTable: PropTypes.func.isRequired,
  onLeaveGroupSharedTable: PropTypes.func.isRequired,
  onAddGroupSharedTable: PropTypes.func.isRequired
};

class MainPanelDTables extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      errorMsg: null,
      isShowCreateGroupDialog: false,
    };
  }

  componentDidMount() {
    this.props.loadWorkspaceList();
    this.props.loadSharedTableList();
  }

  onCreateGroupToggle = () => {
    this.setState({isShowCreateGroupDialog: !this.state.isShowCreateGroupDialog});
  }

  onCreateGroup = () => {
    this.props.loadWorkspaceList();
    this.onCreateGroupToggle();
  }

  renameGroupName = () => {
    this.props.loadWorkspaceList();
  }

  render() {
    let { isWorkspaceListLoading, isSharedTableListLoading, workspaceList, sharedTableList, errorMsg,
      onCopyDTable, onDeleteTable, onDeleteGroup, onAddGroupSharedTable, onLeaveGroupSharedTable } = this.props;
    if (isWorkspaceListLoading || isSharedTableListLoading) {
      return <Loading />;
    }

    let personalWorkspace = workspaceList.find(workspace => {
      return workspace.owner_type === 'Personal';
    });

    let groupWorkspaceList = workspaceList.filter(workspace => {
      return workspace.owner_type === 'Group';
    });
    const isDesktop = Utils.isDesktop();

    return (
      <Fragment>
        <div className="main-panel-center dtable-center">
          <div className="cur-view-container d-flex flex-1 flex-column">
            <div className={`${isDesktop ? '' : 'p-0'} cur-view-content`}>
              {isOrgContext && 
                <div className="py-4 dtable-org-title">{orgName}</div>
              }
              {errorMsg && <p className="error text-center">{errorMsg}</p>}
              {!errorMsg && (
                <Fragment>
                  {personalWorkspace &&
                    <DTableWorkspaceCommon
                      workspace={personalWorkspace}
                      onCopyDTable={onCopyDTable}
                      onDeleteTable={onDeleteTable}
                      onAddGroupSharedTable={onAddGroupSharedTable}
                      onLeaveGroupSharedTable={onLeaveGroupSharedTable}
                    />
                  }
                  {sharedTableList.length > 0 && <DTableWorkspaceShared tableList={sharedTableList} />}
                  {groupWorkspaceList.length > 0 && groupWorkspaceList.map((workspace, index) => {
                    return (
                      <DTableWorkspaceCommon
                        key={index}
                        workspace={workspace}
                        renameGroupName={this.renameGroupName}
                        onDeleteGroup={onDeleteGroup}
                        onDeleteTable={onDeleteTable}
                        onCopyDTable={onCopyDTable}
                        onAddGroupSharedTable={onAddGroupSharedTable}
                        onLeaveGroupSharedTable={onLeaveGroupSharedTable}
                      />
                    );
                  })}
                  {isDesktop && canAddGroup &&
                    <button className="btn btn-secondary dtable-add-btn my-4" onClick={this.onCreateGroupToggle}>{gettext('New Group')}</button>
                  }
                </Fragment>
              )}
            </div>
          </div>
        </div>
        {this.state.isShowCreateGroupDialog && (
          <CreateDtableGroupDialog
            onCreateGroup={this.onCreateGroup}
            toggleAddGroupModal={this.onCreateGroupToggle}
          />
        )}
      </Fragment>
    );
  }
}

MainPanelDTables.propTypes = propTypes;

export default MainPanelDTables;
