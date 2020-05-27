import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Progress from './upload-progress';
import classnames from 'classnames';
import { gettext } from '../../../../utils/constants';

const { formID } = window.shared.pageOptions;

const propTypes = {
  handleImageChange: PropTypes.func,
  value: PropTypes.array,
  deleteImage: PropTypes.func,
  isUploading: PropTypes.bool,
  event: PropTypes.object,
  thumbnailSrc: PropTypes.string,
  uploadPercent: PropTypes.number,
  isErrorTip: PropTypes.bool,
  config: PropTypes.object,
};

class LocalImageAddition extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isImageTipShow: false,
      enterFileIndex: -1
    };
    this.enteredCounter = 0; // Determine whether to enter the child element to avoid dragging bubbling bugs。
  }

  handleImageChange = (event) => {
    event.persist();
    this.props.handleImageChange(event);
  }

  deleteImage = (index) => {
    this.props.deleteImage(index);
  }

  fileDragEnter = (event) => {
    event.preventDefault();
    this.enteredCounter++;
    if (this.enteredCounter !== 0) {
      this.setState({ isImageTipShow: true });
    }
  }

  fileDragOver = (event) => {
    event.stopPropagation();
    event.preventDefault();
  }

  fileDragLeave = () => {
    this.enteredCounter--;
    if (this.enteredCounter === 0) {
      this.setState({ isImageTipShow: false });
    }
  }

  fileDrop = (event) => {
    event.stopPropagation();
    event.preventDefault();
    event.persist();
    this.enteredCounter = 0;
    this.setState({ isImageTipShow: false, enterFileIndex: -1 });
    let files = event.dataTransfer.files;
    let isImage = /image/i.test(files[0].type);
    if (isImage) {
      this.props.handleImageChange(event, files[0]);
    }
  }

  fileUploadClick = () => {
    this.refs.image_file.click();
  }

  onInputFile = (event) => {
    event.stopPropagation();
  }

  showDeleteIcon = (index) => {
    this.setState({ enterFileIndex: index });
  }

  hideDeleteIcon = () => {
    this.setState({ enterFileIndex: -1 });
  }

  fileUploadAgain = () => {
    this.props.handleImageChange(this.props.event);
  }

  calculateImageArr = () => {
    let imageArr = [];
    let { isImageTipShow, enterFileIndex } = this.state;
    let { value, isUploading, thumbnailSrc, uploadPercent, isErrorTip } = this.props;
    if (Array.isArray(value)) {
      imageArr = value.map((imageItem, index) => {
        return (
          <div key = {'image-wrapper-' + index} className="image-wrapper" onMouseEnter={() => this.showDeleteIcon(index)} onMouseLeave={this.hideDeleteIcon}>
            <div className="image-content">
              <img src={imageItem+'?token='+formID} alt=""/>
            </div>
            {enterFileIndex === index &&
              <div className="delete-image-icon" onClick={() => this.deleteImage(index)}  >
                <span className="image-delete-span">x</span>
              </div>
            }
          </div>
        );
      });
      if (isUploading) {
        imageArr.push(
          <div className="image-wrapper" key={'image-wrapper-circle'} >
            <div className="image-upload-percent">
              <img src={thumbnailSrc} style={{ position: 'absolute', zIndex: uploadPercent === 100 ? 3 : 1 }} alt="" />
              {uploadPercent < 100 && !isErrorTip &&
                <Progress 
                  uploadPercent={uploadPercent}
                />
              } 
              {uploadPercent === 100 && 
                <div className="image-upload-success">
                  <div className="image-upload-success-scale">
                    <span className="image-upload-success-icon">
                      <i className="dtable-font dtable-icon-check-mark"></i>
                    </span>
                    <span className="image-upload-success-tip">{gettext('Uploaded completed')}</span>
                  </div>
                </div>
              } 
              <div className="image-upload-mask"></div>
              {isErrorTip && 
                <div className="image-upload-error-tip">
                  <span>{gettext('Network Error')}</span>
                  <span className="image-upload-again" onClick={this.fileUploadAgain}>{gettext('Re-upload')}</span>
                </div>
              }
            </div>
          </div>
        );
      }
      let uploadContainerClassName = 'image-wrapper';
      let addBoxClassName = 'image-add-box';
      let addIconClassName = classnames('image-add-button', {'image-wrapper-drop-active': isImageTipShow});
      let imageTips = '';
      if (imageArr.length === 0) {
        uploadContainerClassName = classnames('image-upload-container', {'image-upload-container-active': isImageTipShow});
        addBoxClassName = classnames('image-tip-addition', {'image-drop-active': isImageTipShow});
        addIconClassName = 'image-add-icon';
        imageTips = isImageTipShow ?
          <div className="image-add-span">{gettext('Drag and drop to add an image')}</div> : 
          <div className="image-add-span">{gettext('Drag and drop images or click here to add')}</div>;
      }
      imageArr.push(
        <div className={uploadContainerClassName}
          key={'image-wrapper-addition'} 
          onDragEnter={this.fileDragEnter} 
          onDragOver={this.fileDragOver} 
          onDragLeave={this.fileDragLeave}
          onDrop={this.fileDrop} 
          onClick={this.fileUploadClick}
        >
          <div className={addBoxClassName}>
            <div className={addIconClassName}>
              <i className="dtable-font dtable-icon-add-files"></i>
              <input type="file" className='upload-image' accept="image/*" ref='image_file' onClick={this.onInputFile} onChange={this.handleImageChange} />
            </div>
            {imageTips}
          </div> 
        </div>
      );
    }
    return imageArr;
  }

  render() {
    return this.calculateImageArr();
  }
}

LocalImageAddition.propTypes = propTypes;

export default withTranslation('dtable')(LocalImageAddition); 