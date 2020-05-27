import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../../utils/constants';
import { Modal, ModalHeader, ModalBody, Button, Input, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import moment from 'moment';
import DtableSharePermissionEditor from '../../../components/select-editor/dtable-share-permission-editor';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import toaster from '../../../components/toast';
import copy from 'copy-to-clipboard';
import Loading from '../../../components/loading';
import { Utils } from '../../../utils/utils';
import DeleteTokenDialog from './delete-token-dialog';

import '../../../css/share-link-dialog.css';


const tokenNavPropTypes = {
  currentTab: PropTypes.string.isRequired,
  switchContent: PropTypes.func.isRequired,
};


class TokenNav extends React.Component {
  constructor(props) {
    super(props);
    this.navItems = [
      {name: 'tokens', text: gettext('Tokens')},
      {name: 'status', text: gettext('Status')}
    ];
  }

  switchContent = (tabName) => {
    this.props.switchContent(tabName);
  }

  render() {
    const { currentTab } = this.props;
    return (
      <div className="cur-view-path tab-nav-container">
        <ul className="nav">
          {this.navItems.map((item, index) => {
            return (
              <li className="nav-item" key={index}>
                <span onClick={this.switchContent.bind(this, item.name)} className={`nav-link${currentTab === item.name ? ' active' : ''}`}>{item.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

TokenNav.propTypes = tokenNavPropTypes;


const apiTokenStatusItemPropTypes = {
  item: PropTypes.object.isRequired,
};


class APITokenStatusItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let item = this.props.item;

    return (
      <tr>
        <td className="name">{item.app_name}</td>
        <td>{item.connected ? <span className="dtable-font dtable-icon-confirm"/> : <span className="dtable-font dtable-icon-x"/>}</td>
        <td>{moment(item.last_access).format('YYYY-MM-DD HH:mm:ss')}</td>
      </tr>
    );
  }
}

APITokenStatusItem.propTypes = apiTokenStatusItemPropTypes;


const apiTokenStatusListContentPropTypes = {
  currentTable: PropTypes.object.isRequired,
};

class APITokenStatusListContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      errorMsg: '',
      apiTokenStatusList: []
    };
    this.workspaceID = this.props.currentTable.workspace_id;
    this.tableName = this.props.currentTable.name;
  }

  componentDidMount() {
    this.listAPITokenStatus();
  }

  listAPITokenStatus = () => {
    dtableWebAPI.listAPITokenStatus(this.workspaceID, this.tableName).then((res) => {
      this.setState({
        apiTokenStatusList: res.data.api_status_list,
        loading: false,
      });
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  render() {
    const renderAPITokenStatusList = this.state.apiTokenStatusList.map((item, index) => {
      return (
        <APITokenStatusItem 
          key={index}
          item={item}
        />);
    });
    return (
      <Fragment>
        {this.state.errorMsg &&
          <div className='w-100'>
            <p className="error text-center">{this.state.errorMsg}</p>
          </div>
        }
        {this.state.loading &&
          <Loading />
        }
        {!this.state.errorMsg && !this.state.loading &&
          <div className='mx-5 mb-5' style={{height: '100%'}}>
            <table>
              <thead>
                <tr>
                  <th width="40%">{gettext('App Name')}</th>
                  <th width="30%">{gettext('Connected')}</th>
                  <th width="30%">{gettext('Last Access')}</th>
                </tr>
              </thead>
              <tbody>
                {renderAPITokenStatusList}
              </tbody>
            </table>
          </div>
        }
      </Fragment>
    );
  }

}

APITokenStatusListContent.propTypes = apiTokenStatusListContentPropTypes;


const apiTokenItemPropTypes = {
  item: PropTypes.object.isRequired,
  deleteAPIToken: PropTypes.func.isRequired,
  updateAPIToken: PropTypes.func.isRequired,
  isItemFreezed: PropTypes.bool.isRequired,
  onFreezedItem: PropTypes.func.isRequired,
  onUnfreezedItem: PropTypes.func.isRequired,
};

class APITokenItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isOperationShow: false,
      isItemMenuShow: false,
      isDeleteTokenDialog: false,
    };
  }

  onMouseEnter = () => {
    if (!this.props.isItemFreezed) {
      this.setState({ isOperationShow : true});
    }
  };

  onMouseLeave = () => {
    if (!this.props.isItemFreezed) {
      this.setState({ isOperationShow : false});
    }
  };

  onDeleteAPIToken = () => {
    this.props.deleteAPIToken(this.props.item.app_name);
    this.onDeleteToggle();
  };

  onUpdateAPIToken = (permission) => {
    this.props.updateAPIToken(this.props.item.app_name, permission);
  };

  onCopyAPIToken = () => {
    let api_token = this.props.item.api_token;
    copy(api_token);
    toaster.success(gettext('API Token is copied to the clipboard.'));
  };

  toggleOperationMenu =() => {
    this.setState({
      isItemMenuShow: !this.state.isItemMenuShow
    }, () => {
      if (this.state.isItemMenuShow) {
        this.props.onFreezedItem();
      } else {
        this.props.onUnfreezedItem();
      }
    });
  }

  onDeleteToggle = () => {
    this.setState({ isDeleteTokenDialog : !this.state.isDeleteTokenDialog });
  }

  render() {
    let item = this.props.item;

    return (
      <Fragment>
        <tr onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
          <td className="name">{item.app_name}</td>
          <td>
            <DtableSharePermissionEditor
              isTextMode={true}
              isEditIconShow={this.state.isOperationShow}
              currentPermission={item.permission}
              onPermissionChanged={this.onUpdateAPIToken}
            />
          </td>
          <td>
            <span className="ellipsis">{item.api_token}</span>
            <span
              className={`dtable-font dtable-icon-copy-link action-icon ${this.state.isOperationShow ? '' : 'hide'}`}
              onClick={this.onCopyAPIToken}
            />
          </td>
          <td>
            {this.state.isOperationShow && 
              <Dropdown isOpen={this.state.isItemMenuShow} toggle={this.toggleOperationMenu}>
                <DropdownToggle 
                  tag="i"
                  className="dtable-font dtable-icon-more-level action-icon"
                  title={gettext('More Operations')}
                  data-toggle="dropdown" 
                  aria-expanded={this.state.isItemMenuShow}
                />
                <DropdownMenu className="mr-2">
                  <DropdownItem onClick={this.onDeleteToggle}>{gettext('Delete')}</DropdownItem>
                </DropdownMenu>
              </Dropdown>}
          </td>
        </tr>
        {this.state.isDeleteTokenDialog &&
          <DeleteTokenDialog
            currentToken={item}
            handleSubmit={this.onDeleteAPIToken}
            deleteCancel={this.onDeleteToggle}
          />}
      </Fragment>
    );
  }
}

APITokenItem.propTypes = apiTokenItemPropTypes;


const apiTokenListContentPropTypes = {
  currentTable: PropTypes.object.isRequired,
};


class APITokenListContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      apiTokenList: [],
      permission: 'rw',
      appName: '',
      errorMsg: '',
      loading: true,
      isSubmitBtnActive: true,
      isItemFreezed: false,
    };
    this.workspaceID = this.props.currentTable.workspace_id;
    this.tableName = this.props.currentTable.name;
  }

  onFreezedItem = () => {
    this.setState({ isItemFreezed : true });
  }

  onUnfreezedItem = () => {
    this.setState({ isItemFreezed : false });
  }

  listAPITokens = () => {
    dtableWebAPI.listTableAPITokens(this.workspaceID, this.tableName).then((res) => {
      this.setState({
        apiTokenList: res.data.api_tokens,
        loading: false,
      });
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  };

  onInputChange = (e) => {
    let appName = e.target.value;
    this.setState({
      appName: appName,
    });
  };

  onKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.addAPIToken();
    }
  };

  setPermission = (permission) => {
    this.setState({permission: permission});
  };

  addAPIToken = () => {
    if (!this.state.appName) {
      return;
    }

    this.setState({
      isSubmitBtnActive: false,
    });
    const {appName, permission, apiTokenList} = this.state;

    dtableWebAPI.addTableAPIToken(this.workspaceID, this.tableName, appName, permission).then((res) => {
      apiTokenList.push(res.data);
      this.setState({
        apiTokenList: apiTokenList,
        isSubmitBtnActive: true,
        appName: '',
      });
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
      this.setState({
        isSubmitBtnActive: true,
        appName: '',
      });
    });
  };

  deleteAPIToken = (appName) => {
    dtableWebAPI.deleteTableAPIToken(this.workspaceID, this.tableName, appName).then((res) => {
      const apiTokenList = this.state.apiTokenList.filter(item => {
        return item.app_name !== appName;
      });
      this.setState({
        apiTokenList: apiTokenList,
      });
      toaster.success(gettext('Delete Successfully'));
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  };

  updateAPIToken = (appName, permission) => {
    dtableWebAPI.updateTableAPIToken(this.workspaceID, this.tableName, appName, permission).then((res) => {
      let userList = this.state.apiTokenList.filter(item => {
        if (item.app_name === appName) {
          item.permission = permission;
        }
        return item;
      });
      this.setState({
        userList: userList,
      });
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  };

  componentDidMount() {
    this.listAPITokens();
  }

  render() {
    const renderAPITokenList = this.state.apiTokenList.map((item, index) => {
      return (
        <APITokenItem
          key={index}
          item={item}
          deleteAPIToken={this.deleteAPIToken}
          updateAPIToken={this.updateAPIToken}
          onFreezedItem={this.onFreezedItem}
          onUnfreezedItem={this.onUnfreezedItem}
          isItemFreezed={this.state.isItemFreezed}
        />
      );
    });
    return (
      <Fragment>
        {this.state.errorMsg &&
        <div className='w-100'>
          <p className="error text-center">{this.state.errorMsg}</p>
        </div>
        }
        {!this.state.errorMsg &&
        <div className='mx-5 mb-5' style={{height: '100%'}}>
          <table>
            <thead>
              <tr>
                <th width="45%">{gettext('App Name')}</th>
                <th width="40%">{gettext('Permission')}</th>
                <th width="15%"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Input
                    type="text"
                    id="appName"
                    value={this.state.appName}
                    onChange={this.onInputChange}
                    onKeyDown={this.onKeyDown}
                  />
                </td>
                <td>
                  <DtableSharePermissionEditor
                    isTextMode={false}
                    isEditIconShow={false}
                    currentPermission={this.state.permission}
                    onPermissionChanged={this.setPermission}
                  />
                </td>
                <td>
                  <Button onClick={this.addAPIToken} disabled={!this.state.isSubmitBtnActive}>{gettext('Submit')}</Button>
                </td>
              </tr>
            </tbody>
          </table>
          {this.state.apiTokenList.length !== 0 &&
          <div className='o-auto' style={{height: 'calc(100% - 91px)'}}>
            <div className="h-100" style={{maxHeight: '18rem'}}>
              <table>
                <thead>
                  <tr>
                    <th width="17%">{gettext('App Name')}</th>
                    <th width="15%">{gettext('Permission')}</th>
                    <th width="58%">{gettext('Access Token')}</th>
                    <th width="10%"></th>
                  </tr>
                </thead>
                <tbody>
                  {renderAPITokenList}
                </tbody>
              </table>
            </div>
          </div>
          }
          {this.state.loading &&
          <Loading/>
          }
        </div>
        }
      </Fragment>
    );
  }

}

APITokenListContent.propTypes = apiTokenListContentPropTypes;


const propTypes = {
  currentTable: PropTypes.object.isRequired,
  onTableAPITokenToggle: PropTypes.func.isRequired,
};


class TableAPITokenDialog extends React.Component {
  constructor(props) {
    super(props);
    this.workspaceID = this.props.currentTable.workspace_id;
    this.tableName = this.props.currentTable.name;
    this.state = {
      currentTab: 'tokens',
    };
  }

  switchContent = (tabName) => {
    this.setState({ currentTab : tabName });
  }

  render() {
    let currentTable = this.props.currentTable;
    let name = currentTable.name;
    let currentTab = this.state.currentTab;
    return (
      <Modal
        isOpen={true} className="share-dialog" style={{maxWidth: '720px'}}
        toggle={this.props.onTableAPITokenToggle}
      >
        <ModalHeader toggle={this.props.onTableAPITokenToggle}>
          {gettext('API Token')} <span className="op-target" title={name}>{name}</span></ModalHeader>
        <ModalBody className="share-dialog-content">
          <div className="column-flex-direction flex-fill">
            <TokenNav 
              currentTab={currentTab} 
              switchContent={this.switchContent} 
            />
            {currentTab === 'tokens' &&
              <APITokenListContent currentTable={currentTable} />
            }
            {currentTab === 'status' &&
              <APITokenStatusListContent currentTable={currentTable} />
            }
          </div>
        </ModalBody>
      </Modal>
    );
  }
}

TableAPITokenDialog.propTypes = propTypes;

export default TableAPITokenDialog;
