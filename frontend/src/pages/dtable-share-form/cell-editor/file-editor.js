import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import ImageThumbnail from '../cell-editor-widgets/file-image-edit/image-thumbnail';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import LocalFileAddition from '../cell-editor-widgets/file-image-edit/local-file-addition';
import { getFileIconUrl } from '../../dtable-share-row/utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { gettext } from '../../../utils/constants';
import '../css/file-editor.css';

const FileEditorPropTypes = {
  isReadOnly: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  column: PropTypes.object,
  onCommit: PropTypes.func,
};

const { dtableName: fileName, workspaceID, dtableWebURL, formToken } = window.shared.pageOptions;
const { serviceURL, mediaUrl } = window.app.config;
const config = {
  server: dtableWebURL,
  workspaceID,
  fileName,
  medialUrl: serviceURL + mediaUrl,
};

class FileEditor extends React.Component {

  static defaultProps = {
    isReadOnly: false,
    value: []
  }

  constructor(props) {
    super(props);
    this.state = {
      newValue: props.value,
      isPopoverShow: false,
      isUpdated: false,
      uploadPercent: 0,
      isUploading: false,
      thumbnailSrc: '',
      enterFileIndex: -1,
      isErrorTip: false,
      event: {},
    };
  }

  onAddFileToggle = (event) => {
    if (event) {
      event.stopPropagation();
    }
    let { isPopoverShow, isUpdated, newValue } = this.state;
    if (isPopoverShow && isUpdated) {
      const { column, onCommit } = this.props;
      let updated = { [column.key]: newValue };
      onCommit(updated);
    }
    this.setState({ isPopoverShow: !isPopoverShow });
  }

  showDeleteIcon = (index) => {
    this.setState({ enterFileIndex: index });
  }

  hideDeleteIcon = () => {
    this.setState({ enterFileIndex: -1 });
  }

  getFormatValue = () => {
    const { medialUrl } = config;
    let fileArr = [];
    let { newValue, enterFileIndex } = this.state;
    if (Array.isArray(newValue) && newValue.length > 0) { 
      newValue.forEach((fileItem, index) => {
        let iconUrl = getFileIconUrl(medialUrl, fileItem.name, fileItem.type);
        fileArr.push(
          <div key={`file-${index}`} className="share-form-item-file" onMouseEnter={() => this.showDeleteIcon(index)} onMouseLeave={this.hideDeleteIcon}>
            <ImageThumbnail src={iconUrl} id={`item-file-${index}`} name={fileItem.name}/>
            {enterFileIndex === index &&
              <div className="editor-delete-icon" onClick={() => this.deleteFile(index)}  >
                <span className="file-delete-span">x</span>
              </div>
            }
          </div>
        );
      });
      fileArr.push(
        <div key={`file-${newValue.length + 1}`} className="share-form-item-file" onClick={this.onFileEditorToggle}>
          <div className="file-add-box">
            <div className="file-add-button">
              <i className="dtable-font dtable-icon-add-files"></i>
            </div>
          </div> 
        </div>
      );
    } else {
      fileArr.push(
        <div key="select-editor-add" onClick={this.onFileEditorToggle} className="select-editor-add">
          {gettext('Add Files')}
        </div>
      );
    }
    return fileArr;
  }

  onFileEditorToggle = () => {
    if (this.props.isReadOnly) return;
    this.setState({ isPopoverShow: !this.state.isPopoverShow });
  }

  deleteFile = (index) => {
    let value = this.state.newValue.slice(0);
    value.splice(index, 1);
    this.setState({
      isUpdated: true,
      newValue: value
    }, () => {
      let { column, onCommit } = this.props;
      let updated = { [column.key]: value };
      onCommit(updated);
    });
  }

  handleFileChange = (event, uploadFile = null) => {
    event.persist();
    let file = uploadFile ? uploadFile : event.target.files[0];
    if (!file) {
      return;
    }
    let { medialUrl } = config;
    let thumbnailSrc = getFileIconUrl(medialUrl, file.name, file.type);
    this.setState({
      isUploading: true,
      isUpdated: true,
      isErrorTip: false,
      thumbnailSrc: thumbnailSrc,
      event: {},
    });

    this.uploadLocalFile(file).then((response) => {
      let value = this.state.newValue.slice(0);
      value.push(response);
      this.setState({
        isUploading: false,
        uploadPercent: 0,
        newValue: value,
        thumbnailSrc: '',
        enterFileIndex: value.length,
      });
    }).catch(err => {
      this.setState({ isErrorTip: true, event: event });
    });
  }

  uploadLocalFile = (imageFile) => {
    let parentPath = '', relativePath='';
    return (
      dtableWebAPI.getUploadLinkViaFormToken(formToken).then((res) => {
        const uploadLink = res.data.upload_link + '?ret-json=1';
        const newFile = new File([imageFile], imageFile.name, {type: File.type});
        const formData = new FormData();
        parentPath = res.data.parent_path;
        relativePath = res.data.file_relative_path;
        formData.append('parent_dir', parentPath);
        formData.append('relative_path', relativePath);
        formData.append('file', newFile);
        return dtableWebAPI.uploadImage(uploadLink, formData, this.onUploadProgress);
      }).then ((res) => {
        return this.setFileMessage(res.data[0].name, parentPath, relativePath, res.data[0].size);
      })
    );
  }

  onUploadProgress = (event) => {
    let { loaded, total } = event;
    let uploadPercent = Math.floor(loaded / total * 100);
    this.setState({uploadPercent});
  }

  setFileMessage(fileName, path, relativePath, size) {
    let { server, workspaceID } = config;
    let url = server + 'workspace/' + workspaceID + path + `/${relativePath}/` + encodeURIComponent(fileName);
    return {
      url,
      size,
      name: fileName,
      type: 'file',
    };
  }

  render() {
    let value = this.getFormatValue();
    let { isPopoverShow, newValue, uploadPercent, isUploading, thumbnailSrc, isErrorTip, event } = this.state;
    return (
      <div className="cell-editor grid-cell-type-file">
        {value}
        {isPopoverShow && (
          <Modal isOpen={true} toggle={this.onAddFileToggle} contentClassName={'file-editor-modal'}>
            <ModalHeader toggle={this.onAddFileToggle}>
              <span className="file-editor-title">{gettext('Add Files')}</span>
            </ModalHeader>
            <ModalBody style={{padding: 0}}>
              <div ref='fileEditorContainer' className="file-editor-container">
                <LocalFileAddition 
                  handleFileChange={this.handleFileChange}
                  value={newValue}
                  uploadPercent={uploadPercent}
                  isUploading={isUploading}
                  deleteFile={this.deleteFile} 
                  thumbnailSrc={thumbnailSrc}
                  config={config}
                  isErrorTip={isErrorTip}
                  event={event}
                />
              </div>
            </ModalBody>
          </Modal>
        )}
      </div>
    );
  }
}

FileEditor.propTypes = FileEditorPropTypes;
export default withTranslation('dtable') (FileEditor);