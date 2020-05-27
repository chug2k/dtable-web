import React from 'react';
import PropTypes from 'prop-types';
import DTableItemShared from './dtable-item-shared';
import Loading from '../../components/loading';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import { Utils } from '../../utils/utils';
import toaster from '../../components/toast';
const gettext = window.gettext;
const username = window.app.pageOptions.username;

const propTypes = {
  tableList: PropTypes.array.isRequired,
};

class DTableWorkspaceShared extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isDataLoading: true,
      tableList: [],
    };
  }

  componentDidMount() {
    let tableList = this.props.tableList;
    this.setState({
      isDataLoading: false,
      tableList: tableList,
    });
  }

  leaveShareTable = (table) => {
    let email = username;
    let tableName = table.name;
    let workspaceID = table.workspace_id;
    dtableWebAPI.deleteTableShare(workspaceID, tableName, email).then(() => {
      let tableList = this.state.tableList.filter(table => {
        return table.name !== tableName;
      });
      this.setState({tableList: tableList});
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
        this.setState({errorMsg: errMsg});
      }
    });
  }

  render() {
    if (this.state.isDataLoading) {
      return <Loading />;
    }

    if (!this.state.tableList.length) {
      return '';
    }

    const isDesktop = Utils.isDesktop();

    return (
      <div className="workspace">
        <div className={`${isDesktop ? '' : 'table-mobile-padding'} table-heading`}>{gettext('Shared with me')}</div>
        <div className={`${isDesktop ? 'table-item-container' : 'table-mobile-item-container'}`}>
          {this.state.tableList.map((table, index) => {
            return (
              <DTableItemShared key={index} table={table} leaveShareTable={this.leaveShareTable} />
            );
          })}
        </div>
      </div>
    );
  }
}

DTableWorkspaceShared.propTypes = propTypes;

export default DTableWorkspaceShared;
