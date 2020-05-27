import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import DeleteDatasetDialog from '../dialog/delete-dataset-dialog';
import DatasetDialog from '../dialog/dataset-dialog';
import DatasetAccessGroupDialog from '../dialog/dataset-access-group-dialog';
import { gettext } from '../../../utils/constants';

class CommonDatasetItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isTableRenaming: false,
      isDropdownOpen: false,
      isItemActive: false,
      isDeleteDatasetDialogOpen: false,
      isDatasetDialogOpen: false,
      isDatasetAccessGroupDialogOpen: false,
    };
  }

  onMouseEnter = () => {
    if (!this.props.isItemFreezed) {
      this.setState({isItemActive: true});
    }
  }

  onMouseLeave = () => {
    if (!this.props.isItemFreezed) {
      this.setState({isItemActive: false});
    }
  }

  toggleDeleteDatasetDialog = () => {
    this.setState({isDeleteDatasetDialogOpen: !this.state.isDeleteDatasetDialogOpen});
  }

  toggleDatasetDialog = () => {
    this.setState({isDatasetDialogOpen: !this.state.isDatasetDialogOpen});
  }

  toggleDatasetAccessGroupDialog = () => {
    this.setState({isDatasetAccessGroupDialogOpen: !this.state.isDatasetAccessGroupDialogOpen});
  }

  handleClickDatasetName = (e) => {
    e.preventDefault();
    this.toggleDatasetDialog();
  }

  deleteDataset = () => {
    this.props.deleteDataset(this.props.dataset);
  }

  dropdownToggle = () => {
    if (this.state.isDropdownOpen) {
      this.setState({ isItemActive: false });
      this.props.onUnfreezedItem();
    } else {
      this.props.onFreezedItem();
    }
    this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
  }

  render() {
    let dataset = this.props.dataset;
    let { isDeleteDatasetDialogOpen, isDatasetDialogOpen, isDatasetAccessGroupDialogOpen, isDropdownOpen,
      isItemActive } = this.state;
    return (
      <div
        className={`table-item dataset-item ${isItemActive ? 'tr-highlight' : ''}`}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      >
        <div className="dataset-icon">
          <span className="dtable-font dtable-icon-table dtable-icon-style"></span>
        </div>
        <div className="dataset-name">
          <a href="#" onClick={this.handleClickDatasetName}>{dataset.dataset_name}</a>
        </div>
        <div className="dataset-dropdown-menu">
          {isItemActive && dataset.can_manage && (
            <Dropdown isOpen={isDropdownOpen} toggle={this.dropdownToggle} direction="down" className="table-item-more-operation">
              <DropdownToggle
                tag='i'
                className='dtable-font dtable-icon-more-vertical cursor-pointer attr-action-icon table-dropdown-menu-icon'
                title={gettext('More Operations')}
                data-toggle="dropdown"
                aria-expanded={isDropdownOpen}
              />
              <DropdownMenu className="drop-list" right={true}>
                <DropdownItem onClick={this.toggleDatasetAccessGroupDialog}>
                  <span className="dtable-font dtable-icon-set-up mr-2"></span>
                  <span>{gettext('Access Permissions')}</span>
                </DropdownItem>
                <DropdownItem onClick={this.toggleDeleteDatasetDialog}>
                  <span className="dtable-font dtable-icon-delete mr-2"></span>
                  <span>{gettext('Delete')}</span>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
        {isDeleteDatasetDialogOpen &&
          <DeleteDatasetDialog
            dataset={dataset}
            deleteCancel={this.toggleDeleteDatasetDialog}
            handleSubmit={this.deleteDataset}
          />
        }
        {isDatasetDialogOpen &&
          <DatasetDialog
            dataset={dataset}
            toggle={this.toggleDatasetDialog}
          />
        }
        {isDatasetAccessGroupDialogOpen &&
          <DatasetAccessGroupDialog
            toggle={this.toggleDatasetAccessGroupDialog}
            datasetId={dataset.id}
          />
        }
      </div>
    );
  }
}

const propTypes = {
  dataset: PropTypes.object.isRequired,
  deleteDataset: PropTypes.func.isRequired,
  isItemFreezed: PropTypes.bool.isRequired,
  onFreezedItem: PropTypes.func.isRequired,
  onUnfreezedItem: PropTypes.func.isRequired,
};

CommonDatasetItem.propTypes = propTypes;

export default CommonDatasetItem;
