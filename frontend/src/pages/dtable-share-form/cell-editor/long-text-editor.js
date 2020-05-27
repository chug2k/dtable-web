import React from 'react';
import PropTypes from 'prop-types';
import LongTextEditorPreviewAll from '../cell-editor-widgets/long-text-editor-preview-all';
import LongTextEditorDialog from '../cell-editor-widgets/long-text-editor-dialog';
import MediaQuery from 'react-responsive';
import LongTextView from '../cell-viewer-mobile/long-text-view';
import { gettext } from '../../../utils/constants';

import '../css/long-text.css';

const propTypes = {
  isReadOnly: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  column: PropTypes.object,
  onCommit: PropTypes.func,
};

class LongTextEditor extends React.Component {

  static defaultProps = {
    isReadOnly: false,
    value: { text: '', perview: '' }
  }

  constructor(props) {
    super(props);
    this.state = {
      newValue: '',
      innerHtml: '',
      isShowEditorDialog: false,
    };

    this.value = props.value ? props.value : {text: '', preview: ''};
  }

  componentDidMount() {
    this.setState({newValue: this.value});
  }

  onCommit = (newValue) => {
    this.setState({newValue: newValue}, () => {
      let updated = {};
      let column = this.props.column;
      updated[column.key] = newValue;
      this.props.onCommit(updated);
    });
  }

  onContentClick = () => {
    if (this.props.isReadOnly) {
      return;
    }
    this.setState({isShowEditorDialog: true});
  }

  onCloseEditorDialog = () => {
    this.setState({isShowEditorDialog: false});
  }

  setEditorRef = (editor) => {
    this.editor = editor;
  }

  render() {
    // todo compatible with grid mode
    const { isShowEditorDialog, newValue } = this.state;
    return (
      <div className="cell-editor grid-cell-type-long-text">
        {newValue.text && (
          <LongTextEditorPreviewAll 
            newValue={newValue} 
            onContentClick={this.onContentClick}
          />
        )}
        {!newValue.text && (
          <div className="editor-operation long-text-editor-edit" onClick={this.onContentClick}>{gettext('Edit Text')}</div>
        )}
        <MediaQuery query="(min-width: 768px)">
          {isShowEditorDialog &&
            <LongTextEditorDialog
              newValue={newValue}
              column={this.props.column}
              onCommit={this.onCommit}
              onCommitCancel={this.onCommitCancel}
              onCloseEditorDialog={this.onCloseEditorDialog}
            />
          }
        </MediaQuery>
        <MediaQuery query="(max-width: 767.8px)">
          {isShowEditorDialog &&
            <div className="cell-viewer-mobile-mask">
              <LongTextView
                column={this.props.column}
                value={newValue}
                onCommit={this.onCommit}
                closeEditor={this.onCloseEditorDialog}
              />
            </div>
          }
        </MediaQuery>
      </div>
    );
  }
}

LongTextEditor.propTypes = propTypes;

export default LongTextEditor;
