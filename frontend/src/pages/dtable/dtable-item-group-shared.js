import React from 'react';
import PropTypes from 'prop-types';
import { Utils } from '../../utils/utils';
import { siteRoot, gettext } from '../../utils/constants';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

const itemGroupSharedPropTypes = {
  isItemFreezed: PropTypes.bool.isRequired,
  table: PropTypes.object.isRequired,
  onLeaveGroupSharedTable: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onFreezedItem: PropTypes.func.isRequired,
  onUnfreezedItem: PropTypes.func.isRequired,
  onAddStarDTable: PropTypes.func.isRequired,
  onUnstarDTable: PropTypes.func.isRequired,
};

class DTableItemGroupShared extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      active: false,
      dropdownOpen: false,
    };
  }

  onMouseEnter = () => {
    if (!this.props.isItemFreezed) {
      this.setState({active: true});
    }
  };

  onMouseLeave = () => {
    if (!this.props.isItemFreezed) {
      this.setState({active: false});
    }
  };

  onLeaveShareTableSubmit = () => {
    let table = this.props.table;
    this.props.onLeaveGroupSharedTable(table);
  }

  onAddStarDTable = () => {
    let { table } = this.props;
    this.props.onAddStarDTable(table.uuid, true);
  }

  onUnstarDTable = () => {
    let { table } = this.props;
    this.props.onUnstarDTable(table.uuid, true);
  }

  dropdownToggle = () => {
    if (this.state.dropdownOpen) {
      this.setState({ active: false });
      this.props.onUnfreezedItem();
    } else {
      this.props.onFreezedItem();
    }
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  }

  render() {
    let { table, isAdmin } = this.props;
    let tableHref = siteRoot + 'workspace/' + table.workspace_id + '/dtable/' + table.name + '/';
    const isDesktop = Utils.isDesktop();

    if (isDesktop) {
      return (
        <div onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} className={ `table-item ${this.state.active ? 'tr-highlight' : ''}`}>
          <div className="table-icon"><span className="dtable-font dtable-icon-table dtable-icon-style"></span></div>
          <div className="table-name">
            <a href={tableHref}>{table.name}</a><span className="share-tip">{gettext('Shared')}</span>
            {table.starred && <span className='dtable-font dtable-icon-star star'/>}
          </div>
          <div className="table-dropdown-menu">
            {this.state.active && 
              <Dropdown isOpen={this.state.dropdownOpen} toggle={this.dropdownToggle} direction="down" className="table-item-more-operation">
                <DropdownToggle
                  tag="i"
                  className="dtable-font dtable-icon-more-vertical cursor-pointer attr-action-icon table-dropdown-menu-icon"
                  title={gettext('More Operations')}
                  data-toggle="dropdown"
                  aria-expanded={this.state.dropdownOpen}
                />
                <DropdownMenu>
                  {isAdmin && <DropdownItem onClick={this.onLeaveShareTableSubmit}>{gettext('Unshare')}</DropdownItem>}
                  {!table.starred && <DropdownItem onClick={this.onAddStarDTable}>{gettext('Star')}</DropdownItem>}
                  {table.starred && <DropdownItem onClick={this.onUnstarDTable}>{gettext('Unstar')}</DropdownItem>}
                </DropdownMenu>
              </Dropdown>
            }
          </div>
        </div>
      );
    }

    return (
      <div className="table-mobile-item">
        <div className="table-mobile-icon"><span className="dtable-font dtable-icon-table"></span></div>
        <div className="table-mobile-name">
          <a href={tableHref}>{table.name}</a><span className="share-tip">{gettext('Shared')}</span>
        </div>
        {isAdmin &&
          <div className="table-mobile-dropdown-menu">
            <i
              className="dtable-font dtable-icon-x table-dropdown-menu-icon"
              title={gettext('Leave Share')}
              onClick={this.onLeaveShareTableSubmit}>
            </i>
          </div>
        }
      </div>
    );
  }
}

DTableItemGroupShared.propTypes = itemGroupSharedPropTypes;

export default DTableItemGroupShared;
