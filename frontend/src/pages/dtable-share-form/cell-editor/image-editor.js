import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import ImageThumbnail from '../cell-editor-widgets/file-image-edit/image-thumbnail';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import LocalImageAddition from '../cell-editor-widgets/file-image-edit/local-image-addition';
import { getFileIconUrl } from '../../dtable-share-row/utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { gettext } from '../../../utils/constants';
import '../css/image-editor.css';

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

class ImageEditor extends React.Component {

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
      enterImageIndex: -1,
      isErrorTip: false,
      event: null,
    };
  }

  onAddImageToggle = (event) => {
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
    this.setState({ enterImageIndex: index });
  }

  hideDeleteIcon = () => {
    this.setState({ enterImageIndex: -1 });
  }

  getFormatValue = () => {
    let fileArr = [];
    let { newValue, enterImageIndex } = this.state;

    if (Array.isArray(newValue) && newValue.length > 0) {
      newValue.forEach((imageItem, index) => {
        let name = decodeURI(imageItem.slice(imageItem.lastIndexOf('/') + 1));
        fileArr.push(
          <div 
            key={`image-${index}`} 
            className="share-form-item-image" 
            onMouseEnter={() => this.showDeleteIcon(index)} 
            onMouseLeave={this.hideDeleteIcon}
          >
            <ImageThumbnail src={imageItem} id={`item-image-${index}`} alt="" name={name}/>
            {enterImageIndex === index &&
              <div className="editor-delete-icon" onClick={() => this.deleteImage(index)} >
                <span className="image-delete-span">x</span>
              </div>
            }
          </div>
        );
      });
      fileArr.push(
        <div key={`image-${newValue.length + 1}`} className="share-form-item-image" onClick={this.onImageEditorToggle}>
          <div className="image-add-box">
            <div className="image-add-button">
              <i className="dtable-font dtable-icon-add-files"></i>
            </div>
          </div> 
        </div>
      );
    } else {
      fileArr.push(
        <div key="select-editor-add" onClick={this.onImageEditorToggle} className="select-editor-add">
          {gettext('Add Images')}
        </div>
      );
    }
    return fileArr;
  }

  onImageEditorToggle = () => {
    if (this.props.isReadOnly) return;
    this.setState({ isPopoverShow: !this.state.isPopoverShow });
  }

  deleteImage = (index) => {
    let value = this.state.newValue.slice(0);
    value.splice(index, 1);
    this.setState({
      isUpdated: true,
      newValue: value,
      enterImageIndex: -1,
    }, () => {
      let { column, onCommit } = this.props;
      let updated = { [column.key]: value };
      onCommit(updated);
    });
  }

  handleImageChange = (event, uploadImage = null) => {
    event.persist();
    let image = uploadImage ? uploadImage : event.target.files[0];
    if (!image) {
      return;
    }
    let { medialUrl } = config;
    let thumbnailSrc = getFileIconUrl(medialUrl, image.name, image.type);
    this.setState({
      isUploading: true,
      isUpdated: true,
      isErrorTip: false,
      thumbnailSrc: thumbnailSrc
    });

    this.uploadLocalFile(image).then((response) => {
      let value = this.state.newValue.slice(0);
      value.push(response);
      this.setState({
        isUploading: false,
        uploadPercent: 0,
        newValue: value,
        thumbnailSrc: '',
        enterImageIndex: value.length,
      });
    }).catch(err => {
      this.setState({ isErrorTip: true, event: event });
    });
  }

  uploadLocalFile = (imageFile) => {
    let parentPath = '', relativePath = '';
    return (
      dtableWebAPI.getUploadLinkViaFormToken(formToken).then((res) => {
        const uploadLink = res.data.upload_link + '?ret-json=1';
        const newFile = new File([imageFile], imageFile.name, {type: imageFile.type});
        const formData = new FormData();
        parentPath = res.data.parent_path;
        relativePath = res.data.img_relative_path;
        formData.append('parent_dir', parentPath);
        formData.append('relative_path', relativePath);
        formData.append('file', newFile);
        return dtableWebAPI.uploadImage(uploadLink, formData, this.onUploadProgress);
      }).then ((res) => {
        return this.getImageUrl(res.data[0].name);
      })
    );
  }

  onUploadProgress = (event) => {
    let { loaded, total } = event;
    let uploadPercent = Math.floor(loaded / total * 100);
    this.setState({uploadPercent});
  }

  getImageUrl(fileName) {
    let { server } = config;
    let url = server + 'dtable/forms/' + formToken + '/asset/' + encodeURIComponent(fileName);
    return url;
  }

  render() {
    let value = this.getFormatValue();
    let { isPopoverShow, newValue, uploadPercent, isUploading, thumbnailSrc, isErrorTip, event } = this.state;
    return (
      <div className="cell-editor grid-cell-type-image">
        {value}
        {isPopoverShow && (
          <Modal isOpen={true} toggle={this.onAddImageToggle} contentClassName={'image-editor-modal'}>
            <ModalHeader toggle={this.onAddImageToggle}>
              <span className="image-editor-title">{gettext('Add Images')}</span>
            </ModalHeader>
            <ModalBody style={{padding: 0}}>
              <div ref='imageEditorContainer' className="image-editor-container">
                <LocalImageAddition 
                  handleImageChange={this.handleImageChange}
                  value={newValue}
                  uploadPercent={uploadPercent}
                  isUploading={isUploading}
                  deleteImage={this.deleteImage} 
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

ImageEditor.propTypes = FileEditorPropTypes;
export default withTranslation('dtable') (ImageEditor);