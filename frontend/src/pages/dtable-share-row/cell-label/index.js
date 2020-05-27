import React from 'react';
import PropTypes from 'prop-types';
import '../css/label.css';

const propTypes = {
  column: PropTypes.object
};

class CellLabel extends React.Component {

  render() {
    let column = this.props.column;
    return (<label className="cell-label">{column.name}</label>);
  }
}

CellLabel.propTypes = propTypes;

export default CellLabel;