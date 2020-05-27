import React from 'react';
import PropTypes from 'prop-types';
import CellLabel from '../../dtable-share-row/cell-label';

const propTypes = {
  column: PropTypes.object,
};

class LabelGenerator extends React.Component {

  render() {
    let { column } = this.props;

    return <CellLabel column={column} />;
  }
}

LabelGenerator.propTypes = propTypes;

export default LabelGenerator;
