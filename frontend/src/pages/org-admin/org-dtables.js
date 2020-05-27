import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import OrgNormalDTables from './org-normal-dtables';
import { gettext } from '../../utils/constants';
import OrgTrashDTables from './org-trash-dtables';
import MainPanelTopbar from './main-panel-topbar';


const OrgDTablesPropTypes = {
  currentTab: PropTypes.string.isRequired,
  tabItemClick: PropTypes.func.isRequired
};


class OrgDTables extends React.Component {
  constructor(props) {
    super(props);
  }

  tabItemClick = (tab) => {
    this.props.tabItemClick(tab);
  }

  render() {
    return (
      <Fragment>
        <MainPanelTopbar/>
        <div className="main-panel-center flex-row">
          <div className="cur-view-container">
            <div className="cur-view-path org-user-nav">
              <ul className="nav">
                <li className="nav-item" onClick={() => this.tabItemClick('tables')}>
                  <span className={`nav-link ${this.props.currentTab === 'tables' ? 'active': ''}`}>{gettext('Tables')}</span>
                </li>
                <li className="nav-item" onClick={() => this.tabItemClick('trash')}>
                  <span className={`nav-link ${this.props.currentTab === 'trash' ? 'active': ''}`} >{gettext('Trash')}</span>
                </li>
              </ul>
            </div>
            {this.props.currentTab === 'tables' && 
              <OrgNormalDTables />
            }
            {this.props.currentTab === 'trash' && 
              <OrgTrashDTables />
            }
          </div>
        </div>
      </Fragment>
    );
  }
}

OrgDTables.propTypes = OrgDTablesPropTypes;

export default OrgDTables;
