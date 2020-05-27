import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import EditorConfig from '../cell-editor/editor-config';

const propTypes = {
  isReadOnly: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.object, PropTypes.bool]),
  column: PropTypes.object,
  onCommit: PropTypes.func.isRequired,
  onCommitCancel: PropTypes.func
};

class FormEditorGenerator extends React.Component {

  static defaultProps = {
    isReadOnly: false,
  }

  getCellEditor = () => {
    let { column } = this.props;
    return EditorConfig[column.type];
  }

  render() {
    let { isReadOnly, value, column, onCommit, onCommitCancel } = this.props;
    let CellEditor = this.getCellEditor();
    let editorProps = {
      isReadOnly: isReadOnly,
      value: value,
      column: column,
      onCommit: onCommit,
      onCommitCancel: onCommitCancel,
    };

    return (
      <Fragment>
        {CellEditor && React.cloneElement(CellEditor, { ...editorProps })}
      </Fragment>
    );
  }
}

FormEditorGenerator.propTypes = propTypes;

export default FormEditorGenerator;
