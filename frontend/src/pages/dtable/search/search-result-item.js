import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  item: PropTypes.object.isRequired,
  onItemClickHandler: PropTypes.func.isRequired,
};

class SearchResultItem extends React.Component {

  onClickHandler = () => {
    var item = this.props.item;
    this.props.onItemClickHandler(item);
  }

  render() {
    let item = this.props.item;
    return (
      <li className="dtable-search-result-item" onClick={this.onClickHandler}>
        <span className="dtable-font dtable-icon-table"></span>
        <div className="item-content">
          <div className="item-name ellipsis">{item.name}</div>
        </div>
      </li>
    );
  }
}

SearchResultItem.propTypes = propTypes;

export default SearchResultItem;
