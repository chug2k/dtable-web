import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Utils } from '../../../utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { siteRoot, loginUrl, gettext } from '../../../utils/constants';
import toaster from '../../../components/toast';
import EmptyTip from '../../../components/empty-tip';
import Loading from '../../../components/loading';
import CommonOperationConfirmationDialog from '../../../components/dialog/common-operation-confirmation-dialog';
import MainPanelTopbar from '../main-panel-topbar';
import OrgNav from './org-nav';

const contentTypes = {
  loading: PropTypes.bool,
  errorMsg: PropTypes.string,
  items: PropTypes.array,
  deleteGroup: PropTypes.func
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
          <h2>{gettext('No groups')}</h2>
        </EmptyTip>
      );
      const table = (
        <Fragment>
          <table className="table-hover">
            <thead>
              <tr>
                <th width="30%">{gettext('Name')}</th>
                <th width="30%">{gettext('Creator')}</th>
                <th width="30%">{gettext('Created At')}</th>
                <th width="10%">{/* Operations */}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                return (<Item
                  key={index}
                  item={item}
                  deleteGroup={this.props.deleteGroup}
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

Content.propTypes = contentTypes;

const itemPropTypes = {
  item: PropTypes.object,
  deleteGroup: PropTypes.func,
};

class Item extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isOpIconShown: false,
      isDeleteDialogOpen: false
    };
  }

  handleMouseEnter = () => {
    this.setState({isOpIconShown: true});
  }

  handleMouseLeave = () => {
    this.setState({isOpIconShown: false});
  }

  toggleDeleteDialog = (e) => {
    if (e) {
      e.preventDefault();
    }
    this.setState({isDeleteDialogOpen: !this.state.isDeleteDialogOpen});
  }

  deleteGroup = () => {
    this.toggleDeleteDialog();
    this.props.deleteGroup(this.props.item.group_id);
  }

  render() {
    const { item } = this.props;
    const { isOpIconShown, isDeleteDialogOpen } = this.state;

    const itemName = '<span class="op-target">' + Utils.HTMLescape(item.group_name) + '</span>';
    const deleteDialogMsg = gettext('Are you sure you want to delete {placeholder} ?').replace('{placeholder}', itemName);

    const groupUrl = item.parent_group_id === 0 ? 
      `${siteRoot}sys/groups/${item.group_id}/libraries/` :
      `${siteRoot}sysadmin/#address-book/groups/${item.group_id}/`;

    return (
      <Fragment>
        <tr onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <td><a href={groupUrl}>{item.group_name}</a></td>
          <td><a href={`${siteRoot}sys/users/${encodeURIComponent(item.creator_email)}/`}>{item.creator_name}</a></td>
          <td>{moment(item.created_at).format('YYYY-MM-DD hh:mm:ss')}</td>
          <td>
            <span className={`action-icon dtable-font dtable-icon-delete ${isOpIconShown ? '' : 'invisible'}`} title={gettext('Delete')} onClick={this.toggleDeleteDialog}></span>
          </td>
        </tr>
        {isDeleteDialogOpen &&
          <CommonOperationConfirmationDialog
            title={gettext('Delete Group')}
            message={deleteDialogMsg}
            executeOperation={this.deleteGroup}
            confirmBtnText={gettext('Delete')}
            toggleDialog={this.toggleDeleteDialog}
          />
        }
      </Fragment>
    );
  }
}

Item.propTypes = itemPropTypes;

const orgGroupsPropTypes = {
  orgID: PropTypes.string,
  onCloseSidePanel: PropTypes.func
};

class OrgGroups extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      errorMsg: '',
      orgName: '',
      groupList: []
    };
  }

  componentDidMount () {
    dtableWebAPI.sysAdminGetOrg(this.props.orgID).then((res) => {
      this.setState({
        orgName: res.data.org_name
      });
    });
    dtableWebAPI.sysAdminListOrgGroups(this.props.orgID).then((res) => {
      this.setState({
        loading: false,
        groupList: res.data.group_list
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

  deleteGroup = (groupID) => {
    dtableWebAPI.sysAdminDismissGroupByID(groupID).then(res => {
      let newGroupList = this.state.groupList.filter(item => {
        return item.group_id !== groupID;
      });
      this.setState({groupList: newGroupList});
      toaster.success(gettext('Successfully deleted 1 item.'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  render() {
    return (
      <Fragment>
        <MainPanelTopbar onCloseSidePanel={this.props.onCloseSidePanel} />
        <div className="main-panel-center flex-row">
          <div className="cur-view-container">
            <OrgNav
              currentItem="groups"
              orgID={this.props.orgID}
              orgName={this.state.orgName}
            />
            <div className="cur-view-content">
              <Content
                loading={this.state.loading}
                errorMsg={this.state.errorMsg}
                items={this.state.groupList}
                deleteGroup={this.deleteGroup}
              />
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

OrgGroups.propTypes = orgGroupsPropTypes;

export default OrgGroups;
