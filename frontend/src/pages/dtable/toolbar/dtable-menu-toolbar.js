import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import CreateDtableGroupDialog from '../dialog/create-dtable-group-dialog';

const propTypes = {
  onShowSidePanel: PropTypes.func.isRequired,
  loadWorkspaceList: PropTypes.func.isRequired,
};

class DtableMenuToolbar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowCreateGroupDialog: false
    };
  }

  onCreateToggle = () => {
    this.setState({
      isShowCreateGroupDialog: !this.state.isShowCreateGroupDialog
    });
  }

  onCreateGroup = () => {
    this.props.loadWorkspaceList();
    this.onCreateToggle();
  }

  render() {
    let pathName = window.location.pathname;
    return(
      <Fragment>
        <div className="dtable-menu-toolbar">
          <span className="dtable-font dtable-icon-menu side-nav-toggle mobile-toolbar-icon" onClick={this.props.onShowSidePanel}></span>
          {(pathName === '/' || pathName === '/dtable/') && 
            <span 
              className="dtable-font dtable-icon-add-table mobile-toolbar-icon" 
              onClick={this.onCreateToggle}>
            </span>
          }
        </div>
        {this.state.isShowCreateGroupDialog && (
          <CreateDtableGroupDialog
            onCreateGroup={this.onCreateGroup}
            toggleAddGroupModal={this.onCreateToggle}
          />
        )}
      </Fragment>
    );
  }
}

DtableMenuToolbar.propTypes = propTypes;

export default DtableMenuToolbar;