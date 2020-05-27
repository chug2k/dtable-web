import React from 'react';
import PropTypes from 'prop-types';
import EditorPortal from '../editor-container/editor-portal';
import EditorContainer from '../editor-container/editor-container';

const propTypes = {
  editorMode: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object, PropTypes.bool, PropTypes.array]),
  column: PropTypes.object.isRequired,
  rowIdx: PropTypes.number,
  rowData: PropTypes.object.isRequired,
  selectedDimensions: PropTypes.object.isRequired, //{ width, left, top, height, zIndex }
  editorPosition: PropTypes.object.isRequired, // { left, top }
  editorPortalTarget: PropTypes.instanceOf(Element).isRequired,
  firstEditorKeyPress: PropTypes.string,
  scrollLeft: PropTypes.number,
  scrollTop: PropTypes.number,
  commit: PropTypes.func.isRequired,
  commitData: PropTypes.func.isRequired,
  commitCancel: PropTypes.func,
  onGridKeyDown: PropTypes.func,
};

class EditorGenerator extends React.Component {

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  commit = (updated) => {
    this.props.commit(updated);
  }

  // handle Real-time storage
  commitData = (updated) => {

  }

  commitCancel = () => {

  }

  getEditorContainer = () => {
    let { editorMode, value, column, rowIdx, rowData, selectedDimensions, editorPosition } = this.props;
    let { editorPortalTarget, scrollLeft, scrollTop, onGridKeyDown, firstEditorKeyPress } = this.props;
    let CustomEditorContainer = EditorContainer;
    // get position
    let { width, height, left, top } = { ...selectedDimensions, ...editorPosition };

    return (
      <CustomEditorContainer 
        editorMode={editorMode}
        value={value}
        column={column}
        rowIdx={rowIdx}
        rowData={rowData}
        width={width}
        height={height}
        left={left}
        top={top}
        editorPortalTarget={editorPortalTarget}
        firstEditorKeyPress={firstEditorKeyPress}
        scrollLeft={scrollLeft}
        scrollTop={scrollTop}
        onGridKeyDown={onGridKeyDown}
        commit={this.commit}
        commitCancel={this.commitCancel}
      />
    );
  }

  render() {
    return (
      <EditorPortal target={this.props.editorPortalTarget}>
        {this.getEditorContainer()}
      </EditorPortal>
    );
  }
}

EditorGenerator.propTypes = propTypes;

export default EditorGenerator;
