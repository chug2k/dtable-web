import React from 'react';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import { Button, Tooltip } from 'reactstrap';
import { gettext } from '../../../utils/constants';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { Utils } from '../../../utils/utils';
import toaster from '../../../components/toast';
import DtableSharePermissionEditor from '../../../components/select-editor/dtable-share-permission-editor';
import DTableInviteLink from '../../../models/dtable-invite-link';

const linkItemPropTypes = {
  inviteLink: PropTypes.object.isRequired,
  onCopyInviteLink: PropTypes.func.isRequired,
  onDeleteInviteLinkSubmit: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

class LinkItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      inviteLink: props.inviteLink,
      isShowDelete: false,
      tooltipOpen: false
    };
  }

  onMouseOver = () => {
    this.setState({isShowDelete: !this.state.isShowDelete});
  }

  tooltipToggle = () => {
    this.setState({ tooltipOpen: !this.state.tooltipOpen });
  }

  convertPermission = (permission) => {
    switch (permission) {
      case 'r':
        return gettext('read-only');
      case 'rw':
        return gettext('read-write');
      default:
        return '';
    }
  }

  onCopyInviteLink = () => {
    let inviteLink = this.props.inviteLink;
    this.props.onCopyInviteLink(inviteLink.link);
  }

  onDeleteInviteLinkSubmit = () => {
    let inviteLink = this.props.inviteLink;
    this.props.onDeleteInviteLinkSubmit(inviteLink);
  }

  render() {
    return (
      <tr onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOver}>
        <td>{this.convertPermission(this.state.inviteLink.permission)}</td>
        <td className='ellipsis'>{this.state.inviteLink.link}</td>
        <td>
          <span className="dtable-font dtable-icon-copy-link action-icon" data-placement="bottom" onClick={this.onCopyInviteLink} id={`copy-link${this.props.index}`} />
          <Tooltip
            toggle={this.tooltipToggle}
            target={`copy-link${this.props.index}`}
            placement='bottom'
            isOpen={this.state.tooltipOpen}
            boundariesElement={document.body}
          >
            {gettext('Copy Link')}
          </Tooltip>
        
        </td>
        <td>
          <span
            className={`dtable-font dtable-icon-x action-icon ${this.state.isShowDelete ? '' : 'hide'}`}
            onClick={this.onDeleteInviteLinkSubmit}
            title={gettext('Delete')}/>
        </td>
      </tr>
    );
  }
}

LinkItem.propTypes = linkItemPropTypes;

const propTypes = {
  workspaceID: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  closeShareDialog: PropTypes.func.isRequired,
};

class GenerateDTableInviteLink extends React.Component {

  constructor(props) {
    super(props);
    this.permissionOptions = ['read-only', 'read-write'];

    this.state = {
      errorMessage: '',
      inviteLink: null,
      inviteLinks: [],
      isLoading: true,
      currentPermission: this.permissionOptions[0],
      isSendLinkShown: false,
      permission: 'rw',
    };
  }

  componentDidMount() {
    let workspaceID = this.props.workspaceID;
    let name = this.props.name;
    this.getDTableInviteLink(workspaceID, name);
  }

  getDTableInviteLink(workspaceID, name) {
    dtableWebAPI.getDTableShareLink(workspaceID, name).then((res) => {
      let inviteLinks = res.data.dtable_share_links.map((inviteLink) => {
        return new DTableInviteLink(inviteLink);
      });
      this.setState({ inviteLinks });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      this.setState({isLoading: true});
      toaster.danger(errMessage);
    });
  }

  generateDTableInviteLink = () => {
    this.setState({errorMessage: ''});
    let { workspaceID, name } = this.props;
    let { permission } = this.state;
    dtableWebAPI.createDTableShareLink(workspaceID, name, permission).then((res) => {
      let newInviteLink = new DTableInviteLink(res.data);
      let { inviteLinks } = this.state;
      inviteLinks.push(newInviteLink);
      this.setState({ inviteLinks });
      toaster.success(gettext('Link generated.'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  onCopyInviteLink = (link) => {
    copy(link);
    toaster.success(gettext('Invite link is copied to the clipboard.'));
    this.props.closeShareDialog();
  }

  deleteInviteLink = (inviteLink) => {
    dtableWebAPI.deleteDTableShareLink(inviteLink.token).then(() => {
      let newInviteLinks = this.state.inviteLinks.filter((item) => {
        return item.token !== inviteLink.token;
      });
      this.setState({ inviteLinks: newInviteLinks });
      toaster.success(gettext('Delete Successfully'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  onDeleteInviteLinkSubmit = (currentInviteLink) => {
    this.deleteInviteLink(currentInviteLink);
  }

  updatePermission = (permission) => {
    this.setState({permission: permission});
  }

  render() {
    return (
      <div>
        <table>
          <thead>
            <tr>
              <th width="80%">{gettext('Permission')}</th>
              <th width="20%"/>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <DtableSharePermissionEditor
                  isTextMode={false}
                  isEditIconShow={false}
                  currentPermission={this.state.permission}
                  onPermissionChanged={this.updatePermission}
                />
              </td>
              <td width="20%">
                <Button onClick={this.generateDTableInviteLink}>{gettext('Generate')}</Button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="dtable-share-link-list-container">
          <div className="h-100" style={{maxHeight: 'calc(18rem - 1.25rem)'}}>
            <table>
              <thead>
                <tr>
                  <th width="15%">{gettext('Permission')}</th>
                  <th width="70%">{gettext('Invite Links')}</th>
                  <th width="7%"/>
                  <th width="8%"/>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.inviteLinks.map((inviteLink, index) => {
                    return (
                      <LinkItem
                        key={inviteLink.token}
                        inviteLink={inviteLink}
                        onCopyInviteLink={this.onCopyInviteLink}
                        onDeleteInviteLinkSubmit={this.onDeleteInviteLinkSubmit}
                        index={index}
                      />
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

GenerateDTableInviteLink.propTypes = propTypes;

export default GenerateDTableInviteLink;
