import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Utils } from '../../../utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { siteRoot, loginUrl, gettext, isPro } from '../../../utils/constants';
import toaster from '../../../components/toast';
import EmptyTip from '../../../components/empty-tip';
import Loading from '../../../components/loading';
import CommonOperationConfirmationDialog from '../../../components/dialog/common-operation-confirmation-dialog';
import MainPanelTopbar from '../main-panel-topbar';
import GroupNav from './group-nav';

const { enableSysAdminViewRepo } = window.sysadmin.pageOptions;

const itemPropTypes = {
  item: PropTypes.object.isRequired,
  deleteDTable: PropTypes.func.isRequired
};

class Item extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isOpIconShown: false,
      isDeleteDTableDialogOpen: false
    };
  }

  handleMouseEnter = () => {
    this.setState({isOpIconShown: true});
  }

  handleMouseLeave = () => {
    this.setState({isOpIconShown: false});
  }

  toggleDeleteDTableDialog = (e) => {
    if (e) {
      e.preventDefault();
    }
    this.setState({isDeleteDTableDialogOpen: !this.state.isDeleteDTableDialogOpen});
  }

  deleteDTable = () => {
    const { item } = this.props;
    this.props.deleteDTable(item);
    this.toggleDeleteDTableDialog();
  }

  renderDTableName = () => {
    const { item } = this.props;
    const table = item;
    if (table.name) {
      if (isPro && enableSysAdminViewRepo) {
        return <a href={`${siteRoot}workspace/${table.workspace_id}/dtable/${table.name}/`}>{table.name}</a>;
      } else {
        return table.name;
      }
    } else {
      return '--';
    }
  }

  render() {
    let { isOpIconShown, isDeleteDTableDialogOpen } = this.state;
    let { item } = this.props;

    let iconClass = Utils.getDTableIconClass();

    let tableName = '<span class="op-target">' + Utils.HTMLescape(item.name) + '</span>';
    let dialogMsg = gettext('Are you sure you want to delete {placeholder} ?').replace('{placeholder}', tableName);

    return (
      <Fragment>
        <tr onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <td><span className={iconClass} /></td>
          <td>{this.renderDTableName()}</td>
          <td>
            <span className={`dtable-font dtable-icon-x action-icon ${isOpIconShown ? '' : 'invisible'}`} title={gettext('Delete')} onClick={this.toggleDeleteDTableDialog}></span>
          </td>
        </tr>
        {isDeleteDTableDialogOpen &&
          <CommonOperationConfirmationDialog
            title={gettext('Delete Table')}
            message={dialogMsg}
            executeOperation={this.deleteDTable}
            confirmBtnText={gettext('Delete')}
            toggleDialog={this.toggleDeleteDTableDialog}
          />
        }
      </Fragment>
    );
  }

}

Item.propTypes = itemPropTypes;

const contentPropTypes = {
  loading: PropTypes.bool.isRequired,
  errorMsg: PropTypes.string,
  items: PropTypes.array,
  deleteDTable: PropTypes.func.isRequired
};

class Content extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { loading, errorMsg, items } = this.props;
    if (loading) {
      return <Loading />;
    } else if (errorMsg) {
      return <p className="error text-center mt-4">{errorMsg}</p>;
    } else {
      const emptyTip = (
        <EmptyTip>
          <h2>{gettext('No tables')}</h2>
        </EmptyTip>
      );
      const table = (
        <Fragment>
          <table className="table-hover">
            <thead>
              <tr>
                <th width="5%">{/* icon */}</th>
                <th width="85%">{gettext('Name')}</th>
                <th width="10%">{/*Operations*/}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                return (<Item
                  key={index}
                  item={item}
                  deleteDTable={this.props.deleteDTable}
                />);
              })}
            </tbody>
          </table>
        </Fragment>
      );
      return items.length ? table : emptyTip;
    }
  }
}

Content.propTypes = contentPropTypes;

const groupDTablesPropTypes = {
  groupID: PropTypes.string,
  onCloseSidePanel: PropTypes.func
};

class GroupDTables extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      errorMsg: '',
      groupName: '',
      tableList: []
    };
  }

  deleteDTable = (table) => {
    dtableWebAPI.sysAdminDeleteDTableFromGroup(this.props.groupID, table.id).then(res => {
      let newTableList = this.state.tableList.filter(item => {
        return item.id !== table.id;
      });
      this.setState({
        tableList: newTableList
      });
      const msg = gettext('Successfully delete table {placeholder}')
        .replace('{placeholder}', table.name);
      toaster.success(msg);
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  };

  componentDidMount () {
    dtableWebAPI.sysAdminListGroupDTables(this.props.groupID).then((res) => {
      this.setState({
        loading: false,
        tableList: res.data.tables,
        groupName: res.data.group_name
      });
    }).catch((error) => {
      if (error.response) {
        if (error.response.status === 403) {
          this.setState({
            loading: false,
            errorMsg: gettext('Permission denied')
          });
          location.href = `${loginUrl}?next=${encodeURIComponent(location.href)}`;
        } else {
          this.setState({
            loading: false,
            errorMsg: gettext('Error')
          });
        }
      } else {
        this.setState({
          loading: false,
          errorMsg: gettext('Please check the network.')
        });
      }
    });
  }

  render() {
    return (
      <Fragment>
        <MainPanelTopbar onCloseSidePanel={this.props.onCloseSidePanel} />
        <div className="main-panel-center flex-row">
          <div className="cur-view-container">
            <GroupNav
              groupID={this.props.groupID}
              groupName={this.state.groupName}
              currentItem="tables"
            />
            <div className="cur-view-content">
              <Content
                loading={this.state.loading}
                errorMsg={this.state.errorMsg}
                items={this.state.tableList}
                deleteDTable={this.deleteDTable}
              />
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

}

GroupDTables.propTypes = groupDTablesPropTypes;

export default GroupDTables;
