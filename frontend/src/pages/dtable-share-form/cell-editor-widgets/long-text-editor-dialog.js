import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { SimpleEditor } from '@seafile/seafile-editor';
import getPreviewContent from '../utils/markdown-utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';

const { workspaceID, dtableName, dtableWebURL } = window.shared.pageOptions;

const propTypes = {
  newValue: PropTypes.object,
  column: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired,
  onCloseEditorDialog: PropTypes.func.isRequired,
};

/**
 * use simple editor need to block shortcuts for external containers
 */

class EditorUtilities {

  uploadLocalImage = (imageFile) => {
    let parentPath;
    return (
      dtableWebAPI.getTableAssetUploadLink(workspaceID, dtableName).then((res) => {
        const uploadLink = res.data.upload_link + '?ret-json=1';
        const newFile = new File([imageFile], imageFile.name, {type: imageFile.type});
        const formData = new FormData();
        parentPath = res.data.parent_path;
        formData.append('parent_dir', parentPath);
        formData.append('relative_path', 'images');
        formData.append('file', newFile);
        return dtableWebAPI.uploadImage(uploadLink, formData, this.onUploadProgress);
      }).then ((res) => {
        return this._getImageURL(res.data[0].name, parentPath);
      })
    );
  }
  
  _getImageURL(fileName, path) {
    // todo
    let url = dtableWebURL + 'workspace/' + workspaceID + path + '/images/' + encodeURIComponent(fileName);
    return url;
  }
}

const editorUtilities = new EditorUtilities();

class LongTextEditorDialog extends React.Component {

  constructor(props) {
    super(props);
    this.timer = null;
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      if (this.isContentChanged()) {
        let currentContent = this.getCurrentContent();
        this.props.onCommit(currentContent);
      }
    }, 6000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  onKeyDown = (event) => {
    event.stopPropagation();
  }

  toggle = () => {
    if (this.isContentChanged()) {
      let currentContent = this.getCurrentContent();
      this.props.onCommit(currentContent);
    }
    this.props.onCloseEditorDialog();
  }

  isContentChanged = () => {
    return this.simpleEditor.hasContentChange();
  }

  getCurrentContent = () => {
    let markdownContent = this.simpleEditor.getMarkdown();
    let { previewText , images, links } = getPreviewContent(markdownContent);
    let newValue = Object.assign({}, this.value, { text: markdownContent, preview: previewText, images: images, links: links });
    return newValue;
  }

  setSimpleEditorRef = (editor) => {
    this.simpleEditor = editor;
  }

  render() {
    let { newValue, column } = this.props;
    return (
      <Modal 
        isOpen={true} 
        toggle={this.toggle} 
        onKeyDown={this.onKeyDown}
        wrapClassName={'long-text-editor-dialog-wrapper'}
        className={'long-text-editor-dialog'}
        contentClassName={'long-text-editor-dialog-content'}
        size={'lg'}
        style={{width: 770}}
      >
        <ModalHeader className="long-text-editor-dialog-title" toggle={this.toggle}>{column.name}</ModalHeader>
        <ModalBody className={'long-text-editor-dialog-main'}>
          <SimpleEditor 
            onRef={this.setSimpleEditorRef.bind(this)}
            editorUtilities={editorUtilities}
            value={newValue.text}
          />
        </ModalBody>
      </Modal>
    );
  }
}

LongTextEditorDialog.propTypes = propTypes;

export default LongTextEditorDialog;
