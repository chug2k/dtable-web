import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Utils } from '../../utils/utils';

const gettext = window.gettext;
const { siteRoot } = window.app.config;

const propTypes = {
  table: PropTypes.object.isRequired,
  leaveShareTable: PropTypes.func.isRequired,
};

class DTableItemShared extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      active: false,
    };
  }

  
  onMouseEnter = () => {
    this.setState({active: true});
  };
  
  onMouseLeave = () => {
    this.setState({active: false});
  };
  
  onLeaveShareTableSubmit = () => {
    let table = this.props.table;
    this.props.leaveShareTable(table);
  };

  renderShareItem = () => {
    let table = this.props.table;
    let tableHref = siteRoot + 'workspace/' + table.workspace_id + '/dtable/' + table.name + '/';
    const isDesktop = Utils.isDesktop();
    if (isDesktop) {
      return (
        <div onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} className={ `table-item ${this.state.active ? 'tr-highlight' : ''}`}>
          <div className="table-icon"><span className="dtable-font dtable-icon-table dtable-icon-style"></span></div>
          <div className="table-name">
            <a href={tableHref}>{table.name}</a>
          </div>
          <div className="table-dropdown-menu">
            <i
              className="dtable-font dtable-icon-x action-icon"
              title={gettext('Leave Share')}
              style={!this.state.active ? {opacity: 0} : {}}
              onClick={this.onLeaveShareTableSubmit}>
            </i>
          </div>
        </div>
      );
    }
    return (
      <div className="table-mobile-item">
        <div className="table-mobile-icon"><span className="dtable-font dtable-icon-table"></span></div>
        <div className="table-mobile-name">
          <a href={tableHref}>{table.name}</a>
        </div>
        <div className="table-mobile-dropdown-menu">
          <i
            className="dtable-font dtable-icon-x table-dropdown-menu-icon"
            title={gettext('Leave Share')}
            onClick={this.onLeaveShareTableSubmit}>
          </i>
        </div>
      </div>
    );
  }
  
  render() {
    return (
      <Fragment>
        {this.renderShareItem()}
      </Fragment>
    );
  }
}

DTableItemShared.propTypes = propTypes;

export default DTableItemShared;
