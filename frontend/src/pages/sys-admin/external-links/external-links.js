import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Utils } from '../../../utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { loginUrl, gettext, siteRoot } from '../../../utils/constants';
import toaster from '../../../components/toast';
import Loading from '../../../components/loading';
import EmptyTip from '../../../components/empty-tip';
import Paginator from '../../../components/paginator';
import MainPanelTopbar from '../main-panel-topbar';
import CommonOperationConfirmationDialog from '../../../components/dialog/common-operation-confirmation-dialog';
import ExterLinkOpMenu from './op-menu';

const contentPropTypes = {
  loading: PropTypes.bool.isRequired,
  errorMsg: PropTypes.string,
  items: PropTypes.array,
  pageInfo: PropTypes.object,
  deleteExternalLink: PropTypes.func.isRequired,
  getListByPage: PropTypes.func.isRequired,
  resetPerPage: PropTypes.func.isRequired,
  hasNextPage: PropTypes.bool,
  page: PropTypes.number,
  perPage: PropTypes.number
};

class Content extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isItemFreezed: false
    };
  }

  onFreezedItem = () => {
    this.setState({isItemFreezed: true});
  }

  onUnfreezedItem = () => {
    this.setState({isItemFreezed: false});
  }

  getPreviousPage = () => {
    this.props.getListByPage(this.props.page - 1);
  }

  getNextPage = () => {
    this.props.getListByPage(this.props.page + 1);
  }

  render() {
    const { loading, errorMsg, items, hasNextPage, page, resetPerPage, perPage } = this.props;
    if (loading) {
      return <Loading />;
    } else if (errorMsg) {
      return <p className="error text-center mt-4">{errorMsg}</p>;
    } else {
      const emptyTip = (
        <EmptyTip>
          <h2>{gettext('No external links')}</h2>
        </EmptyTip>
      );
      const table = (
        <Fragment>
          <table>
            <thead>
              <tr>
                <th width="35%">{gettext('Base')}</th>
                <th width="30%">{gettext('Creator')}</th>
                <th width="20%">{gettext('Created At')}</th>
                <th width='10%'>{gettext('Count')}</th>
                <th width="5%">{/* operation */}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                return (<Item
                  key={index}
                  item={item}
                  isItemFreezed={this.state.isItemFreezed}
                  onFreezedItem={this.onFreezedItem}
                  onUnfreezedItem={this.onUnfreezedItem}
                  deleteExternalLink={this.props.deleteExternalLink}
                />);
              })}
            </tbody>
          </table>
          <Paginator
            gotoPreviousPage={this.getPreviousPage}
            gotoNextPage={this.getNextPage}
            currentPage={page}
            hasNextPage={hasNextPage}
            resetPerPage={resetPerPage}
            curPerPage={perPage}
          />
        </Fragment>
      );
      return items.length ? table : emptyTip;
    }
  }
}

Content.propTypes = contentPropTypes;

const itemPropTypes = {
  item: PropTypes.object.isRequired,
  isItemFreezed: PropTypes.bool.isRequired,
  onFreezedItem: PropTypes.func.isRequired,
  onUnfreezedItem: PropTypes.func.isRequired,
  deleteExternalLink: PropTypes.func.isRequired,
};

class Item extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isOpIconShow: false,
      highlight: false,
      isDeleteDialogOpen: false,
      isTransferDialogOpen: false,
    };
  }

  handleMouseEnter = () => {
    if (!this.props.isItemFreezed) {
      this.setState({
        isOpIconShow: true,
        highlight: true
      });
    }
  }

  handleMouseLeave = () => {
    if (!this.props.isItemFreezed) {
      this.setState({
        isOpIconShow: false,
        highlight: false
      });
    }
  }

  onUnfreezedItem = () => {
    this.setState({
      highlight: false,
      isOpIconShow: false
    });
    this.props.onUnfreezedItem();
  }

  onMenuItemClick = (operation) => {
    switch (operation) {
      case 'Visit':
        this.openExternalPage();
        break;
      case 'Delete':
        this.toggleDeleteDialog();
        break;
      default:
        break;
    }
  }

  openExternalPage = (e) => {
    window.open(siteRoot + 'dtable/external-links/' + this.props.item.token + '/');
  }

  toggleDeleteDialog = (e) => {
    if (e) {
      e.preventDefault();
    }
    this.setState({isDeleteDialogOpen: !this.state.isDeleteDialogOpen});
  }

  deleteExternalLink = () => {
    this.props.deleteExternalLink(this.props.item.token);
  }

  render() {
    const { isDeleteDialogOpen } = this.state;
    const { item } = this.props;
    let deleteDialogMsg = gettext('Are you sure you want to delete external link?');

    return (
      <Fragment>
        <tr className={this.state.highlight ? 'tr-highlight' : ''} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <td>{item.from_dtable}</td>
          <td>{item.creator_name}</td>
          <td>
            <span title={moment(item.created_at).format('llll')}>{moment(item.create_at).fromNow()}</span>
          </td>
          <td>{item.view_cnt}</td>
          <td>
            {this.state.isOpIconShow &&
              <ExterLinkOpMenu
                onMenuItemClick={this.onMenuItemClick}
                onFreezedItem={this.props.onFreezedItem}
                onUnfreezedItem={this.onUnfreezedItem}
              />
            }
          </td>
        </tr>
        {isDeleteDialogOpen &&
          <CommonOperationConfirmationDialog
            title={gettext('Delete External Link')}
            message={deleteDialogMsg}
            executeOperation={this.deleteExternalLink}
            confirmBtnText={gettext('Delete')}
            toggleDialog={this.toggleDeleteDialog}
          />
        }
      </Fragment>
    );
  }
}

Item.propTypes = itemPropTypes;

const ExternalLinksPropTypes = {
  onCloseSidePanel: PropTypes.func
};

class ExternalLinks extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      errorMsg: '',
      externalLinkList: [],
      perPage: 25,
      page: 1,
      hasNextPage: false,
    };
  }

  componentDidMount () {
    let urlParams = (new URL(window.location)).searchParams;
    const { page, perPage } = this.state;
    this.setState({
      perPage: parseInt(urlParams.get('per_page') || perPage),
      page: parseInt(urlParams.get('page') || page)
    }, () => {
      this.getExternalLinkListByPage(this.state.page);
    }); 
  }

  resetPerPage = (perPage) => {
    this.setState({
      perPage: perPage
    }, () => {
      this.getExternalLinkListByPage(this.state.page);
    }); 
  }

  getExternalLinkListByPage = (page) => {
    dtableWebAPI.sysAdminListExternalLinks(page, this.state.perPage).then((res) => {
      this.setState({
        loading: false,
        externalLinkList: res.data.external_link_list,
        hasNextPage: res.data.has_next_page,
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

  getListByPage = (page) => {
    this.setState({page: page});
    this.getExternalLinkListByPage(page);
  }

  deleteExternalLink = (token) => {
    dtableWebAPI.sysAdminDeleteExternalLink(token).then(res => {
      let newLinkList = this.state.externalLinkList.filter(item => {
        return item.token !== token;
      });
      this.setState({
        externalLinkList: newLinkList
      });
      toaster.success(gettext('Successfully deleted 1 item.'));
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  render() {
    return (
      <Fragment>
        <MainPanelTopbar/>
        <div className="main-panel-center flex-row">
          <div className="cur-view-container">
            <div className="cur-view-path">
              <h3 className="sf-heading">{gettext('External Links')}</h3>
            </div>
            <div className="cur-view-content">
              <Content
                loading={this.state.loading}
                errorMsg={this.state.errorMsg}
                items={this.state.externalLinkList}
                hasNextPage={this.state.hasNextPage}
                perPage={this.state.perPage}
                page={this.state.page}
                getListByPage={this.getListByPage}
                resetPerPage={this.resetPerPage}
                deleteExternalLink={this.deleteExternalLink}
              />
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

ExternalLinks.propTypes = ExternalLinksPropTypes;

export default ExternalLinks;
