import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownMenu, DropdownToggle, DropdownItem } from 'reactstrap';
import { gettext } from '../../../utils/constants';
import { Utils } from '../../../utils/utils';

const propTypes = {
  onFreezedItem: PropTypes.func.isRequired,
  onUnfreezedItem: PropTypes.func.isRequired,
  restoreDTable: PropTypes.func.isRequired,
};

class DTableTrashOpMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isItemMenuShow: false
    };
  }

  onRestoreDTable = (e) => {
    let operation = Utils.getEventData(e, 'op');
    this.props.restoreDTable(operation);
  }

  onDropdownToggleClick = (e) => {
    this.toggleOperationMenu(e);
  }

  toggleOperationMenu = (e) => {
    this.setState(
      {isItemMenuShow: !this.state.isItemMenuShow},
      () => {
        if (this.state.isItemMenuShow) {
          this.props.onFreezedItem();
        } else {
          this.props.onUnfreezedItem();
        }
      }
    );
  }

  translateOperations = (item) => {
    let translateResult = '';
    switch(item) {
      case 'Restore':
        translateResult = gettext('Restore');
        break;
      default:
        break;
    }

    return translateResult;
  }

  render() {
    let operations = ['Restore', ];

    return (
      <Dropdown isOpen={this.state.isItemMenuShow} toggle={this.toggleOperationMenu}>
        <DropdownToggle 
          tag="i"
          className="dtable-font dtable-icon-more-vertical dtable-dropdown-more d-flex"
          title={gettext('More Operations')}
          data-toggle="dropdown" 
          aria-expanded={this.state.isItemMenuShow}
        />
        <DropdownMenu className="mr-2">
          {operations.map((item, index )=> {
            return (<DropdownItem key={index} data-op={item} onClick={this.onRestoreDTable}>{this.translateOperations(item)}</DropdownItem>);
          })}
        </DropdownMenu>
      </Dropdown>
    );
  }
}

DTableTrashOpMenu.propTypes = propTypes;

export default DTableTrashOpMenu;
