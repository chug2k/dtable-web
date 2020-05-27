import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

const gettext = window.gettext;

const propTypes = {
  onRenameDtableGroup: PropTypes.func.isRequired,
  onManageMembersToggle: PropTypes.func.isRequired,
  onDtableManageMembers: PropTypes.func.isRequired,
  onDeleteGroupToggle: PropTypes.func,
  isOwner: PropTypes.bool,
  workspace: PropTypes.object,
};

class GroupDropdownMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isTableRenaming: false,
      dropdownOpen: false,
      active: false,
      isOwner: props.isOwner,
    };
  }

  dropdownToggle = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  }

  onRenameTableToggle = () => {
    this.props.onRenameDtableGroup();
  }

  onManageMembersToggle = () => {
    this.props.onManageMembersToggle();
    this.props.onDtableManageMembers();
  }

  onDeleteGroupToggle = (workspace) => {
    this.props.onDeleteGroupToggle(workspace);
  }
  
  render() {
    return (
      <Dropdown isOpen={this.state.dropdownOpen} toggle={this.dropdownToggle} direction="down" className="table-item-more-operation">
        <DropdownToggle
          tag='i'
          className='dtable-font dtable-icon-drop-down cursor-pointer mx-2'
          title={gettext('More Operations')}
          data-toggle="dropdown"
          aria-expanded={this.state.dropdownOpen}
        >
        </DropdownToggle>
        <DropdownMenu className="drop-list">
          {this.state.isOwner &&
            <DropdownItem onClick={this.onRenameTableToggle}>{gettext('Rename')}</DropdownItem>
          }
          <DropdownItem onClick={this.onManageMembersToggle}>{gettext('Manage Members')}</DropdownItem>
          {this.state.isOwner &&
            <DropdownItem onClick={this.onDeleteGroupToggle.bind(this.props.workspace)}>{gettext('Delete Group')}</DropdownItem>
          }
        </DropdownMenu>
      </Dropdown>
    );
  }
}

GroupDropdownMenu.propTypes = propTypes;

export default GroupDropdownMenu;