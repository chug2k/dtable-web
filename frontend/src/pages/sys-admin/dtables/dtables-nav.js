import React from 'react';
import PropTypes from 'prop-types';
import { Link } from '@reach/router';
import { siteRoot, gettext } from '../../../utils/constants';

const propTypes = {
  currentItem: PropTypes.string.isRequired
};

class DTableNav extends React.Component {

  constructor(props) {
    super(props);
    this.navItems = [
      {name: 'all-dtables', urlPart: 'all-dtables', text: gettext('Tables')},
      {name: 'trash-dtables', urlPart: 'trash-dtables', text: gettext('Trash')}
    ];
  }

  render() {
    const { currentItem } = this.props;
    return (
      <div className="cur-view-path tab-nav-container">
        <ul className="nav">
          {this.navItems.map((item, index) => {
            return (
              <li className="nav-item" key={index}>
                <Link to={`${siteRoot}sys/${item.urlPart}/`} className={`nav-link${currentItem === item.name ? ' active' : ''}`}>{item.text}</Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

DTableNav.propTypes = propTypes;

export default DTableNav;
