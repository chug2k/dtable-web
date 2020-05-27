import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle, DropdownItem } from 'reactstrap';
import DeleteDatasetDialog from '../../dialog/delete-dataset-dialog';
import DatasetView from './dataset-view';
import DatasetAccessGroupDialog from '../../dialog/dataset-access-group-dialog';
import { gettext } from '../../../../utils/constants';

class CommonDatasetItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isDropdownOpen: false,
      isDeleteDatasetDialogOpen: false,
      isDatasetViewOpen: false,
      isDatasetAccessGroupDialogOpen: false,
    };
  }

  toggleDatasetAccessGroupDialog = () => {
    this.setState({isDatasetAccessGroupDialogOpen: !this.state.isDatasetAccessGroupDialogOpen});
  }

  toggleDeleteDatasetDialog = () => {
    this.setState({isDeleteDatasetDialogOpen: !this.state.isDeleteDatasetDialogOpen});
  }

  toggleDatasetView = () => {
    this.setState({isDatasetViewOpen: !this.state.isDatasetViewOpen});
  }

  handleClickDatasetName = (e) => {
    e.preventDefault();
    this.toggleDatasetView();
  }

  deleteDataset = () => {
    this.props.deleteDataset(this.props.dataset);
  }

  dropdownToggle = () => {
    this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
  }

  render() {
    let dataset = this.props.dataset;
    let { isDeleteDatasetDialogOpen, isDatasetViewOpen, isDatasetAccessGroupDialogOpen, isDropdownOpen } = this.state;
    return (
      <div className="dataset-item dataset-mobile-item">
        <div className="dataset-mobile-icon">
          <span className="dtable-font dtable-icon-table dtable-icon-style"></span>
        </div>
        <div className="dataset-mobile-name">
          <a href="#" onClick={this.handleClickDatasetName}>{dataset.dataset_name}</a>
        </div>
        <div className="dataset-mobile-dropdown-menu">
          <Dropdown isOpen={isDropdownOpen} toggle={this.dropdownToggle} direction="down" className="table-item-more-operation">
            <DropdownToggle
              tag='i'
              className='dtable-font dtable-icon-more-vertical table-dropdown-menu-icon'
              title={gettext('More Operations')}
              data-toggle="dropdown"
              aria-expanded={isDropdownOpen}
            >
            </DropdownToggle>
            <div className={isDropdownOpen ? '' : 'd-none'} onClick={this.dropdownToggle}>
              <div className="mobile-operation-menu-bg-layer"></div>
              <div className="mobile-operation-menu">
                <DropdownItem onClick={this.toggleDatasetAccessGroupDialog} className="mobile-dropdown-item">
                  <span className="dtable-font dtable-icon-set-up mr-2"></span>
                  <span>{gettext('Access Permissions')}</span>
                </DropdownItem>
                <DropdownItem onClick={this.toggleDeleteDatasetDialog} className="mobile-dropdown-item">
                  <span className="dtable-font dtable-icon-delete mr-2"></span>
                  <span>{gettext('Delete')}</span>
                </DropdownItem>
              </div>
            </div>
          </Dropdown>
        </div>
        {isDatasetAccessGroupDialogOpen &&
          <DatasetAccessGroupDialog
            toggle={this.toggleDatasetAccessGroupDialog}
            datasetId={dataset.id}
          />
        }
        {isDeleteDatasetDialogOpen &&
          <DeleteDatasetDialog
            dataset={dataset}
            deleteCancel={this.toggleDeleteDatasetDialog}
            handleSubmit={this.deleteDataset}
          />
        }
        {isDatasetViewOpen &&
          <DatasetView
            dataset={dataset}
            toggle={this.toggleDatasetView}
          />
        }
      </div>
    );
  }
}

const propTypes = {
  dataset: PropTypes.object.isRequired,
  deleteDataset: PropTypes.func.isRequired,
};

CommonDatasetItem.propTypes = propTypes;

export default CommonDatasetItem;
