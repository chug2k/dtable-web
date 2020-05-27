import React, { Fragment }  from 'react';
import PropTypes from 'prop-types';
import { gettext, cloudMode, isOrgContext, canGenerateShareLink, canGenerateExternalLink } from '../../../utils/constants';
import { Modal, ModalHeader, ModalBody, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import ShareTableToUser from './share-table-to-user';
import ShareTableToGroup from './share-table-to-group';
import GenerateDTableInviteLink from './generate-dtable-invite-link';
import GenerateDTableExternalLink from './generate-dtable-external-link';

import '../../../css/share-link-dialog.css';

const propTypes = {
  currentTable: PropTypes.object.isRequired,
  shareCancel: PropTypes.func.isRequired,
  onAddGroupSharedTable: PropTypes.func.isRequired,
  onLeaveGroupSharedTable: PropTypes.func.isRequired
};

class ShareTableDialog extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'shareToUser',
    };
  }

  toggle = (tab) => {
    if (this.state.activeTab !== tab) {
      this.setState({activeTab: tab});
    }
  };

  onAddGroupSharedTable = (groupID, table) => {
    this.props.onAddGroupSharedTable(groupID, table);
  }

  renderContent = () => {
    let activeTab = this.state.activeTab;

    return (
      <Fragment>
        <div className="share-dialog-side">
          <Nav pills vertical>
            <Fragment>
              <NavItem>
                <NavLink
                  className={activeTab === 'shareToUser' ? 'active' : ''}
                  onClick={this.toggle.bind(this, 'shareToUser')}
                >
                  {gettext('Share to user')}
                </NavLink>
              </NavItem>
              {(!cloudMode || isOrgContext) && (
                <NavItem>
                  <NavLink
                    className={activeTab === 'shareToGroup' ? 'active' : ''}
                    onClick={this.toggle.bind(this, 'shareToGroup')}
                  >
                    {gettext('Share to group')}
                  </NavLink>
                </NavItem>
              )}
              {canGenerateShareLink && (
                <NavItem>
                  <NavLink
                    className={activeTab === 'inviteLink' ? 'active' : ''}
                    onClick={this.toggle.bind(this, 'inviteLink')}
                  >
                    {gettext('Invite link')}
                  </NavLink>
                </NavItem>
              )}
              {canGenerateExternalLink && (
                <NavItem>
                  <NavLink
                    className={activeTab === 'externalLink' ? 'active' : ''}
                    onClick={this.toggle.bind(this, 'externalLink')}
                  >
                    {gettext('External link')}
                  </NavLink>
                </NavItem>
              )}
              
            </Fragment>
          </Nav>
        </div>
        <div className="share-dialog-main">
          <TabContent activeTab={this.state.activeTab}>
            <TabPane tabId="shareToUser">
              <ShareTableToUser currentTable={this.props.currentTable} />
            </TabPane>
            {(!cloudMode || isOrgContext) && 
              <TabPane tabId="shareToGroup">
                <ShareTableToGroup
                  currentTable={this.props.currentTable}
                  onAddGroupSharedTable={this.onAddGroupSharedTable}
                  onLeaveGroupSharedTable={this.props.onLeaveGroupSharedTable}
                />
              </TabPane>
            }
            {canGenerateShareLink && (
              <TabPane tabId="inviteLink">
                <GenerateDTableInviteLink
                  workspaceID={this.props.currentTable.workspace_id}
                  name={this.props.currentTable.name}
                  closeShareDialog={this.props.shareCancel}
                />
              </TabPane>
            )}
            {canGenerateExternalLink && (
              <TabPane tabId="externalLink">
                <GenerateDTableExternalLink 
                  workspaceID={this.props.currentTable.workspace_id}
                  name={this.props.currentTable.name}
                  closeShareDialog={this.props.shareCancel}
                />
              </TabPane>
            )}
          </TabContent>
        </div>
      </Fragment>
    );
  };

  render() {
    let currentTable = this.props.currentTable;
    let name = currentTable.name;

    return (
      <Modal isOpen={true} toggle={this.props.shareCancel} style={{maxWidth: '720px'}} className="share-dialog" >
        <ModalHeader toggle={this.props.shareCancel}>{gettext('Share')} <span className="op-target" title={name}>{name}</span></ModalHeader>
        <ModalBody className="share-dialog-content">
          {this.renderContent()}
        </ModalBody>
      </Modal>
    );
  }
}

ShareTableDialog.propTypes = propTypes;

export default ShareTableDialog;
