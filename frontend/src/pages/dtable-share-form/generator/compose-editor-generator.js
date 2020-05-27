import React from 'react';
import PropTypes from 'prop-types';
import FormatterGenerator from './formatter-generator';
import EditorGenerator from './editor-generator';

const propTypes = {

};

class ComposeEditorGenerator extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
    };
  }

  onCommit = () => {

  }

  onCommitData = () => {
    
  }

  onClick = () => {
    this.setState({isEditing: true});
  }

  render() {
    let { column } = this.props.column;
    return (
      <div className="compose-editor" onClick={this.onClick}>
        {this.state.isEditing ? <FormatterGenerator /> : <EditorGenerator />}
      </div>
    );
  }
}

ComposeEditorGenerator.propTypes = propTypes;

export default ComposeEditorGenerator;
