import React from 'react';
import PropTypes from 'prop-types';
import CollaboratorEditorOption from '../cell-editor-widgets/collaborator-editor-option';
import CollaboratorEditorPopover from '../cell-editor-widgets/collaborator-editor-popover';

import '../css/collaborator.css'; 

const propTypes = {
  isReadOnly: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  column: PropTypes.object,
  onCommit: PropTypes.func,
};

const POPOVER_MAX_HEIGHT = 200;

class CollaboratorEditor extends React.Component {

  static defaultProps = {
    isReadOnly: false,
    value: [],
  }

  constructor(props) {
    super(props);
    this.state = {
      newValue: null,
      isDataInit: false,
      isPopoverShow: false,
    };
  }

  componentDidMount() {
    let value = this.props.value;
    this.setState({ 
      newValue: value,
      isDataInit: true,
    });
    document.addEventListener('click', this.onDocumentToggle);
  }
  
  componentWillUnmount() {
    document.removeEventListener('click', this.onDocumentToggle);
  }

  formatCollaborators = () => {
    let { newValue } = this.state;
    
    if (!newValue || newValue.length === 0) {
      return [];
    }

    let collaborators = window.app.collaborators;
    let selectedCollaborators = collaborators.length > 0 && collaborators.filter(collaborator => {
      return newValue && newValue.indexOf(collaborator.email) > -1;
    });
    return selectedCollaborators || [];
  }

  onCommit = (newValue) => {
    let updated = {};
    let { column } = this.props;
    updated[column.key] = newValue;
    this.props.onCommit(updated, column);
  }
  
  onDocumentToggle = () => {
    this.setState({isPopoverShow: false});
  }

  onAddCollaboratorToggle = (event) => {
    event.nativeEvent.stopImmediatePropagation();
    event.stopPropagation();
    if (this.props.isReadOnly) {
      return;
    }
    this.setState({isPopoverShow: !this.state.isPopoverShow});
  }

  onDeleteCollaborator = (collaborator) => {
    let { newValue: currentValue } = this.state;
    let newValue = currentValue.filter(item => item !== collaborator.email);
    this.setState({newValue: newValue}, () => {
      this.onCommit(newValue);
    });
  }

  onOptionItemToggle = (collaborator) => {
    let { newValue: currentValue } = this.state;
    let newValue = currentValue.slice(0);  // make a copy

    let email_index = newValue.indexOf(collaborator.email);
    if (email_index > -1) {
      newValue.splice(email_index, 1);
    } else {
      newValue.push(collaborator.email);
    }

    this.setState({newValue: newValue}, () => {
      this.onCommit(newValue);
    });

  }

  setEditorRef = (editor) => {
    this.editor = editor;
  }

  caculatePopoverPosition = () => {
    let innerHeight = window.innerHeight;
    let { top, left, height } = this.editor.getClientRects()[0];
    let isBelow = (innerHeight - (top + height)) > POPOVER_MAX_HEIGHT;
    let position = { top : (top + height + 1), left: left};
    if (!isBelow) {
      let bottom = innerHeight - top;
      position = { bottom: bottom, left: left };
    }
    return position;
  }

  getPopoverStyle = () => {
    let defaultPosition = { 
      position: 'absolute',
    };
    let position = this.caculatePopoverPosition();
    return Object.assign({}, {...defaultPosition}, {...position});
  }
  
  render() {

    let collaborators = window.app.collaborators;
    let selectedCollaborators = this.formatCollaborators();

    let { isDataInit } = this.state;
    let popoverStyle = null;
    if (isDataInit) {
      popoverStyle = this.getPopoverStyle();
    }

    return (
      <div className="cell-editor grid-cell-type-collaborator">
        <div ref={this.setEditorRef} className="collaborator-editor-container">
          {selectedCollaborators.map((collaborator, index) => {
            return <CollaboratorEditorOption key={index} collaborator={collaborator} onDeleteCollaborator={this.onDeleteCollaborator}/>;
          })}
        </div>
        <div className="collaborator-editor-add" onClick={this.onAddCollaboratorToggle}>
          <i className="dtable-font dtable-icon-add-square"></i>
        </div>
        {this.state.isPopoverShow && (
          <CollaboratorEditorPopover
            popoverStyle={popoverStyle}
            collaborators={collaborators} 
            selectedCollaborators={selectedCollaborators}
            onOptionItemToggle={this.onOptionItemToggle} 
          />
        )}
      </div>
    );
  }
}

CollaboratorEditor.propTypes = propTypes;

export default CollaboratorEditor;
