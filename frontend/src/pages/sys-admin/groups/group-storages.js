import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Utils } from '../../../utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { siteRoot } from '../../../utils/constants';
import MainPanelTopbar from '../main-panel-topbar';
import Dirent from '../../../models/system-admin/dirent';
import GroupNav from './group-nav';
import DirPathBar from './group-storages-dir-path-bar';
import DirContent from './group-storages-dir-content';

class GroupStorages extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      errorMsg: '',
      groupName: '',
      path: '',
      direntList: [],
    };
  }

  componentDidMount () {
    this.loadDirentList('/');
  }

  onPathClick = (path) => {
    this.loadDirentList(path);
  }

  openFolder = (dirent) => {
    let direntPath = Utils.joinPath(this.state.path, dirent.name);
    if (!dirent.is_file) {
      this.loadDirentList(direntPath);
    }
  }

  loadDirentList = (path) => {
    const groupID = this.props.groupID;
    dtableWebAPI.sysAdminListGroupRepoDirents(groupID, path).then(res => {
      let direntList = [];
      res.data.dirent_list.forEach(dirent => {
        direntList.push(new Dirent(dirent));
      });
      this.setState({
        loading: false,
        direntList: direntList,
        groupName: res.data.group_name,
        path: path,
      }, () => {
        let url = siteRoot + 'sys/groups/' + groupID + '/storages' + Utils.encodePath(path);
        window.history.replaceState({url: url, path: path}, path, url);
      });
    }).catch((error) => {
      this.setState({
        loading: false,
        errorMsg: Utils.getErrorMsg(error, true) // true: show login tip if 403
      });
    });
  }

  render() {
    const { loading, errorMsg, groupName, direntList, path } = this.state;

    return (
      <Fragment>
        <MainPanelTopbar/>
        <div className="main-panel-center flex-row">
          <div className="cur-view-container">
            <GroupNav
              currentItem="storages"
              groupID={this.props.groupID}
              groupName={groupName}
            />
            <div className="cur-view-content">
              <div className="cur-view-path align-items-center">
                <DirPathBar
                  groupName={groupName}
                  currentPath={path}
                  onPathClick={this.onPathClick}
                />
              </div>
              <DirContent
                loading={loading}
                errorMsg={errorMsg}
                direntList={direntList}
                openFolder={this.openFolder}
              />
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const propTypes = {
  groupID: PropTypes.string,
};
GroupStorages.propTypes = propTypes;
export default GroupStorages;
