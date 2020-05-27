import React from 'react';
import PropTypes from 'prop-types';
import LabelGenerator from './generator/label-generator';
import FormEditorGenerator from './generator/form-editor-generator';

const propTypes = {
  isReadOnly: PropTypes.bool,
  column: PropTypes.object.isRequired,
  firstEditorKeyPress: PropTypes.string,
  onCommit: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.object, PropTypes.bool]),
};

class RowItem extends React.Component {

  static defaultProps = {
    isReadOnly: false,
  }

  constructor(props) {
    super(props);
    this.editorMode = 'form_mdoe';
  }

  onCommit = (updated) => {
    let { onCommit } = this.props;
    if (onCommit) {
      onCommit(updated);
    }
  }

  setRowRef = (rowItem) => {
    this.rowItem = rowItem;
  }

  render() {
    let { isReadOnly, column, value } = this.props;
    return (
      <div className="form_mode compose-editor">
        <div className="cell-label-container">
          <LabelGenerator column={column}></LabelGenerator>
        </div>
        <div ref={(rowItem) => {this.setRowRef(rowItem);}} >
          <FormEditorGenerator
            isReadOnly={isReadOnly}
            value={value}
            column={column}
            onCommit={this.onCommit}
          />
        </div>
      </div>
    );
  }
}

RowItem.propTypes = propTypes;

export default RowItem;
