import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import { orgID, gettext } from '../../utils/constants';
import { Utils } from '../../utils/utils';
import toaster from '../../components/toast';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import moment from 'moment';
import ModalPortal from '../../components/modal-portal';
import DeleteTableDialog from '../dtable/dialog/delete-table-dialog';
import Paginator from '../../components/paginator';


const ItemPropTypes = {
  item: PropTypes.object.isRequired,
  isItemFreezed: PropTypes.bool.isRequired,
  onFreezedItem: PropTypes.func.isRequired,
  onUnfreezedItem: PropTypes.func.isRequired,
  deleteDTable: PropTypes.func.isRequired,
};


class Item extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isOpIconShown: false,
      isItemMenuShow: false,
      highlight: false,
      isDeleteDialogOpen: false,
    };
  }

  handleMouseOver = () => {
    if (!this.props.isItemFreezed) {
      this.setState({
        isOpIconShown: true,
        highlight: true
      });
    }
  }

  handleMouseOut = () => {
    if (!this.props.isItemFreezed) {
      this.setState({
        isOpIconShown: false,
        highlight: false
      });
    }
  }

  onUnfreezedItem = () => {
    this.setState({
      highlight: false,
      isOpIconShown: false
    });
    this.props.onUnfreezedItem();
  }

  onMenuItemClick = (operation) => {
    switch (operation) {
      case 'Delete':
        this.toggleDeleteDialog();
        break;
      default:
        break;
    }
  }

  onDeleteDTable = () => {
    const item = this.props.item;
    let dtableName = item.name;

    dtableWebAPI.orgAdminDeleteDTable(orgID, item.id).then(() => {
      this.props.deleteDTable(item);
      const msg = gettext('Successfully deleted {name}.').replace('{name}', dtableName);
      toaster.success(msg);
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });

    this.toggleDeleteDialog();
  }

  toggleDeleteDialog = () => {
    this.setState({ isDeleteDialogOpen: !this.state.isDeleteDialogOpen });
  }

  onMouseEnter = () => {
    if (!this.props.isItemFreezed) {
      this.setState({isOpIconShown: true, highlight: true});
    }
  }

  onMouseLeave = () => {
    if (!this.props.isItemFreezed) {
      this.setState({isOpIconShown: false, highlight: false});
    }
  }

  toggleOperationMenu = () => {
    this.setState({
      isItemMenuShow: !this.state.isItemMenuShow
    }, () => {
      if (this.state.isItemMenuShow) {
        this.props.onFreezedItem();
      } else {
        this.setState({highlight: false});
        this.props.onUnfreezedItem();
      }
    });
  }

  render() {
    const item = this.props.item;
    let { isOpIconShown } = this.state;
    return (
      <Fragment>
        <tr className={this.state.highlight ? 'tr-highlight' : ''} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
          <td><span className="dtable-font dtable-icon-table system-dtable-font" aria-hidden="true"></span></td>
          <td>
            {item.name}
          </td>
          <td>{item.uuid}</td>
          <td>{item.creator}</td>
          <td>{moment(item.created_at).format('YYYY-MM-DD HH:mm:ss')}</td>
          <td>
            {isOpIconShown && (
              <Dropdown isOpen={this.state.isItemMenuShow} toggle={this.toggleOperationMenu}>
                <DropdownToggle
                  tag="a"
                  className="attr-action-icon dtable-font dtable-icon-more-vertical"
                  title={gettext('More Operations')}
                  data-toggle="dropdown"
                  aria-expanded={this.state.isItemMenuShow}
                />
                <DropdownMenu>
                  <DropdownItem onClick={this.toggleDeleteDialog}>{gettext('Delete')}</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </td>
        </tr>
        {this.state.isDeleteDialogOpen &&
          <ModalPortal>
            <DeleteTableDialog
              currentTable={item}
              handleSubmit={this.onDeleteDTable}
              deleteCancel={this.toggleDeleteDialog}
            />
          </ModalPortal>
        }
      </Fragment>
    );
  }
}

Item.propTypes = ItemPropTypes;


class OrgNormalDTables extends React.Component {
  constructor(props) {
    super(props);
    this.state = ({
      isItemFreezed: false,
      dtableList: [],
      page: 1,
      per_page: 25,
    });
  }

  componentDidMount() {
    this.loadDTables(this.state.page);
  }

  loadDTables(page) {
    dtableWebAPI.orgAdminListDTables(orgID, page, this.state.per_page).then((res) => {
      this.setState({
        dtableList: res.data.dtable_list,
        count: res.data.count
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  onFreezedItem = () => {
    this.setState({isItemFreezed: true});
  }

  onUnfreezedItem = () => {
    this.setState({isItemFreezed: false});
  }

  deleteDTable = (item) => {
    let dtableList = this.state.dtableList.slice();
    dtableList = dtableList.filter((dtable) => {return dtable.id !== item.id;});
    this.setState({dtableList: dtableList});
  }

  getPreviousPageList = () => {
    this.setState({
      page: this.state.page - 1
    }, () => {
      this.loadDTables(this.state.page);
    });
  }

  getNextPageList = () => {
    this.setState({
      page: this.state.page + 1
    }, () => {
      this.loadDTables(this.state.page);
    });
  }

  resetPerPage = (per_page) => {
    this.setState({
      per_page: per_page
    },() => {
      this.loadDTables(1);
    });
  }

  render() {
    let { dtableList, page, per_page, count } = this.state;
    return (
      <div className='cur-view-content'>
        <table>
          <thead>
            <tr>
              <th width="5%">{/*icon*/}</th>
              <th width="18%">{gettext('Name')}</th>
              <th width="32%">ID</th>
              <th width="25%">{gettext('Creator')}</th>
              <th width="15%">{gettext('Created At')}</th>
              <th width="5%">{/*Operations*/}</th>
            </tr>
          </thead>
          <tbody>
            {dtableList.map((item, index) => {
              return (
                <Item 
                  key={index}
                  item={item}
                  isItemFreezed={this.state.isItemFreezed}
                  onFreezedItem={this.onFreezedItem}
                  onUnfreezedItem={this.onUnfreezedItem}
                  deleteDTable={this.deleteDTable}
                />
              );
            })}
          </tbody>
        </table>
        <Paginator
          gotoPreviousPage={this.getPreviousPageList}
          gotoNextPage={this.getNextPageList}
          currentPage={page}
          hasNextPage={Utils.hasNextPage(page, per_page, count)}
          canResetPerPage={true}
          curPerPage={per_page}
          resetPerPage={this.resetPerPage}
        />
      </div>
    );
  }
}

export default OrgNormalDTables;
