import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, DropdownItem, DropdownMenu, DropdownToggle, Dropdown } from 'reactstrap';
import moment from 'moment';
import { gettext } from '../../../utils/constants';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { Utils } from '../../../utils/utils';
import Loading from '../../../components/loading';
import Dirent from '../../../models/system-admin/dirent';
import toaster from '../../../components/toast';
import DeleteAssetFileDialog from './delete-asset-file-dialog';

import '../../../css/asset-manage-dialog.css';


const AssetItemPropTypes = {
  dirent: PropTypes.object.isRequired,
  currentPath: PropTypes.string.isRequired,
  openFolder: PropTypes.func.isRequired,
  deleteAssetFile: PropTypes.func.isRequired,
  isItemFreezed: PropTypes.bool.isRequired,
  onFreezedItem: PropTypes.func.isRequired,
  onUnfreezedItem: PropTypes.func.isRequired,
};


class AssetManageItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpIconShown: false,
      isItemMenuShow: false,
      isDeleteAssetFileDialog: false,
    };
  }

  openFolder = () => {
    this.props.openFolder(this.props.dirent.name);
  }

  deleteFileSubmit = () => {
    this.props.deleteAssetFile(this.props.currentPath, this.props.dirent.name);
    this.onDeleteToggle();
  }

  onDeleteToggle = () => {
    this.setState({
      isDeleteAssetFileDialog: !this.state.isDeleteAssetFileDialog,
    });
  }

  onMouseEnterToggle = () => {
    if (!this.props.isItemFreezed) {
      this.setState({
        isOpIconShown: true,
      });
    }
  }

  onMouseLeaveToggle = () => {
    if (!this.props.isItemFreezed) {
      this.setState({
        isOpIconShown: false,
      });
    }
  }

  toggleOperationMenu = () => {
    this.setState({
      isItemMenuShow: !this.state.isItemMenuShow,
    }, () => {
      if (this.state.isItemMenuShow) {
        this.props.onFreezedItem();
      } else {
        this.props.onUnfreezedItem();
      }
    });
  }

  render() {
    let dirent = this.props.dirent;
    let iconUrl = Utils.getDirentIcon(dirent);

    return (
      <Fragment>
        <tr onMouseEnter={this.onMouseEnterToggle} onMouseLeave={this.onMouseLeaveToggle}>
          <td className="text-center"><img src={iconUrl} width="24" alt='' /></td>
          <td>
            {dirent.is_file ?
              dirent.name :
              <span onClick={this.openFolder} className="asset-dir">{dirent.name}</span>
            }
          </td>
          <td>{dirent.is_file ? Utils.bytesToSize(dirent.size) : ''}</td>
          <td>{moment(dirent.mtime).fromNow()}</td>
          <td>{this.state.isOpIconShown && 
            <Dropdown isOpen={this.state.isItemMenuShow} toggle={this.toggleOperationMenu}>
              <DropdownToggle 
                tag="i"
                className="dtable-font dtable-icon-more-vertical asset-dropdown-more d-flex"
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
        {this.state.isDeleteAssetFileDialog &&
          <DeleteAssetFileDialog
            currentDirent={this.props.dirent}
            handleSubmit={this.deleteFileSubmit}
            deleteCancel={this.onDeleteToggle}
          />}
      </Fragment>
    );
  }
}

AssetManageItem.propTypes = AssetItemPropTypes;

const assetContentPropTypes = {
  currentPath: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  errorMsg: PropTypes.string,
  openFolder: PropTypes.func.isRequired,
  direntList: PropTypes.array.isRequired,
  deleteAssetFile: PropTypes.func.isRequired,
};


class AssetManageContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isItemFreezed: false,
    };
  }

  onFreezedItem = () => {
    this.setState({ isItemFreezed : true });
  }

  onUnfreezedItem = () => {
    this.setState({ isItemFreezed : false});
  }

  render() {
    let { loading, errorMsg, direntList, openFolder, currentPath } = this.props;
    if (loading) {
      return <Loading />;
    } else if (errorMsg) {
      return <p className="error text-center mt-4">{errorMsg}</p>;
    } else {
      return (
        <Fragment>
          <table className="table-hover">
            <thead>
              <tr>
                <th width="5%">{/*icon*/}</th>
                <th width="55%">{gettext('Name')}</th>
                <th width="20%">{gettext('Size')}</th>
                <th width="15%">{gettext('Last Update')}</th>
                <th width="%5"></th>
              </tr>
            </thead>
            <tbody>
              {direntList.map((dirent, index) => {
                return <AssetManageItem
                  key={index}
                  dirent={dirent}
                  currentPath={currentPath}
                  openFolder={openFolder}
                  isItemFreezed={this.state.isItemFreezed}
                  onFreezedItem={this.onFreezedItem}
                  onUnfreezedItem={this.onUnfreezedItem}
                  deleteAssetFile={this.props.deleteAssetFile}
                />;
              })}
            </tbody>
          </table>
        </Fragment>
      );
    }
  }

}

AssetManageContent.propTypes = assetContentPropTypes;


const assetPathBarPropTypes = {
  currentPath: PropTypes.string.isRequired,
  table: PropTypes.object.isRequired,
  loadDirentList: PropTypes.func.isRequired
};


class AssetDirPathBar extends React.Component {
  constructor(props) {
    super(props);
  }

  loadDirentList = (e) => {
    let path = Utils.getEventData(e, 'path');
    this.props.loadDirentList(path);
  }

  turnPathToLink = (path) => {
    path = path.replace(/\/+$/, '');
    let pathList = path.split('/');
    let nodePath = '';
    let pathElem = pathList.map((item, index) => {
      if (item === '') {
        return null;
      }
      if (index === pathList.length - 1) {
        return (
          <Fragment key={index}>
            <span className="path-split">/</span>
            <span className="path-file-name">{item}</span>
          </Fragment>
        );
      } else {
        nodePath += '/' + item;
        return (
          <Fragment key={index}>
            <span className="path-split">/</span>
            <span data-path={nodePath} onClick={this.loadDirentList} className="path-link">{item}</span>
          </Fragment>
        );
      }
    });
    return pathElem;
  }

  render() {
    let { currentPath, table } = this.props;
    let pathElem = this.turnPathToLink(currentPath);
    return (
      <div className="path-container">
        <span className="path-split">/</span>
        {(currentPath === '/' || currentPath === '') ? 
          <span>{table.name}</span> :
          <span data-path={'/'} onClick={this.loadDirentList} className="path-link">{table.name}</span>}
        {pathElem}
      </div>
    );
  }
}

AssetDirPathBar.propTypes = assetPathBarPropTypes;


const assetDialogPropTypes = {
  table: PropTypes.object.isRequired,
  onAssetManageToggle: PropTypes.func.isRequired
};


class AssetManageDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      direntList: [],
      errorMsg: null,
      currentPath: '/',
    };
  }

  componentDidMount() {
    this.loadDirentList('/');
  }

  openFolder = (dirName) => {
    let path = Utils.joinPath(this.state.currentPath, dirName);
    this.loadDirentList(path);
  }

  deleteAssetFile = (parent_path, file) => {
    dtableWebAPI.deleteDTableAsset(this.props.table.uuid, parent_path, file).then(() => {
      let newDirentList = this.state.direntList.filter((item) => {return item.name !== file;});
      this.setState({ direntList : newDirentList});
      toaster.success(gettext('Item deleted'));
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  loadDirentList = (path) => {
    this.setState({ loading : true });
    dtableWebAPI.listDTableAsset(this.props.table.uuid, path).then((res) => {
      this.setState({ 
        direntList: res.data.dirent_list.map((item) => {return new Dirent(item);}),
        loading: false,
        currentPath: path,
      });
    }).catch((error) => {
      this.setState({
        loading: false,
        errorMsg: Utils.getErrorMsg(error)
      });
    });
  }

  render() {
    let { table } = this.props;
    let { currentPath, loading, errorMsg, direntList } = this.state;
    return (
      <Modal
        isOpen={true} className="asset-manage-dialog" style={{maxWidth: '780px'}}
        toggle={this.props.onAssetManageToggle}
      >
        <ModalHeader toggle={this.props.onAssetManageToggle}>
          <span className="op-target" title={table.name}>{table.name}</span> {gettext('Attachments Admin')}
        </ModalHeader>
        <ModalBody className="cur-view-content">
          <div className="cur-view-path align-items-center">
            <AssetDirPathBar 
              currentPath={currentPath}
              table={table}
              loadDirentList={this.loadDirentList}
            />
          </div>
          <AssetManageContent 
            currentPath={currentPath}
            loading={loading}
            errorMsg={errorMsg}
            openFolder={this.openFolder}
            direntList={direntList}
            deleteAssetFile={this.deleteAssetFile}
          />
        </ModalBody>
      </Modal>
    );
  }
}

AssetManageDialog.propTypes = assetDialogPropTypes;

export default AssetManageDialog;
