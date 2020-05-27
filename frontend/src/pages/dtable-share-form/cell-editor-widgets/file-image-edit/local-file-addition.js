import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Progress from './upload-progress';
import { getFileIconUrl } from '../../../dtable-share-row/utils/utils';
import classnames from 'classnames';
import { gettext } from '../../../../utils/constants';

const propTypes = {
  handleFileChange: PropTypes.func,
  value: PropTypes.array,
  deleteFile: PropTypes.func,
  isUploading: PropTypes.bool,
  event: PropTypes.object,
  thumbnailSrc: PropTypes.string,
  uploadPercent: PropTypes.number,
  isErrorTip: PropTypes.bool,
  config: PropTypes.object,
};

class LocalFileAddition extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isFileTipShow: false,
      enterFileIndex: -1
    };
    this.enteredCounter = 0; // Determine whether to enter the child element to avoid dragging bubbling bugs。
  }

  handleFileChange = (event) => {
    event.persist();
    this.props.handleFileChange(event);
  }

  deleteFile = (index) => {
    this.props.deleteFile(index);
  }

  fileDragEnter = (event) => {
    event.preventDefault();
    this.enteredCounter++;
    if (this.enteredCounter !== 0) {
      this.setState({ isFileTipShow: true });
    }
  }

  fileDragOver = (event) => {
    event.stopPropagation();
    event.preventDefault();
  }

  fileDragLeave = () => {
    this.enteredCounter--;
    if (this.enteredCounter === 0) {
      this.setState({ isFileTipShow: false });
    }
  }

  fileDrop = (event) => {
    event.stopPropagation();
    event.preventDefault();
    event.persist();
    this.enteredCounter = 0;
    this.setState({ isFileTipShow: false });
    let files = event.dataTransfer.files;
    let reader = new FileReader();
    reader.onload = () => {
      this.props.handleFileChange(event, files[0]);
    };
    reader.readAsText(files[0]);
  }

  fileUploadClick = () => {
    this.refs.files.click();
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
    this.props.handleFileChange(this.props.event);
  }

  calculateFileArr = () => {
    let fileArr = [];
    let { config, value, isUploading, thumbnailSrc, uploadPercent, isErrorTip } = this.props;
    let { isFileTipShow, enterFileIndex } = this.state;
    let { medialUrl } = config;
    if (Array.isArray(value)) {
      fileArr = value.map((fileItem, index) => {
        let fileIconUrl = getFileIconUrl(medialUrl ,fileItem.name, fileItem.direntType);
        return (
          <div key = {'file-wrapper-' + index} className="file-wrapper" onMouseEnter={() => this.showDeleteIcon(index)} onMouseLeave={this.hideDeleteIcon}>
            <div className="file-content">
              <img src={fileIconUrl} alt=""/>
            </div>
            {enterFileIndex === index &&
              <div className="delete-file-icon" onClick={() => this.deleteFile(index)}  >
                <span className="file-delete-span">x</span>
              </div>
            }
          </div>
        );
      });
      if (isUploading) {
        let fileIconUrl = thumbnailSrc;
        fileArr.push(
          <div className="file-wrapper" key={'file-wrapper-circle'} >
            <div className="file-upload-percent">
              <img src={fileIconUrl} style={{position: 'absolute', zIndex: uploadPercent === 100 ? 3 : 1}} alt="" />
              {uploadPercent < 100 && !isErrorTip &&
                <Progress 
                  uploadPercent={uploadPercent}
                />
              } 
              {uploadPercent === 100 && 
                <div className="file-upload-success">
                  <div className="file-upload-success-scale">
                    <span className="file-upload-success-icon">
                      <i className="dtable-font dtable-icon-check-mark"></i>
                    </span>
                    <span className="file-upload-success-tip">{gettext('Uploaded completed')}</span>
                  </div>
                </div>
              } 
              <div className="file-upload-mask"></div>
              {isErrorTip && 
                <div className="file-upload-error-tip">
                  <span>{gettext('Network Error')}</span>
                  <span className="file-upload-again" onClick={this.fileUploadAgain}>{gettext('Re-upload')}</span>
                </div>
              }
            </div>
          </div>
        );
      }
      let uploadContainerClassName = 'file-wrapper';
      let addBoxClassName = 'file-add-box';
      let addIconClassName = classnames('file-add-button', {'file-wrapper-drop-active': isFileTipShow});
      let fileTips = '';
      if (fileArr.length === 0) {
        uploadContainerClassName = classnames('file-upload-container', {'file-upload-container-active': isFileTipShow});
        addBoxClassName = classnames('file-tip-addition', {'file-drop-active': isFileTipShow});
        addIconClassName = 'file-add-icon';
        fileTips = isFileTipShow ?
          <div className="file-add-span">{gettext('Drag and drop to add a file')}</div> : 
          <div className="file-add-span">{gettext('Drag and drop files or click here to add')}</div>;
      }
      fileArr.push(
        <div className={uploadContainerClassName}
          key={'file-wrapper-addition'} 
          onDragEnter={this.fileDragEnter} 
          onDragOver={this.fileDragOver} 
          onDragLeave={this.fileDragLeave}
          onDrop={this.fileDrop} 
          onClick={this.fileUploadClick}
        >
          <div className={addBoxClassName}>
            <div className={addIconClassName}>
              <i className="dtable-font dtable-icon-add-files"></i>
              <input type="file" ref='files'  className='upload-file' onClick={this.onInputFile} onChange={this.handleFileChange} />
            </div>
            {fileTips}
          </div> 
        </div>
      );
    }
    return fileArr;
  }

  render() {
    return this.calculateFileArr();
  }
}

LocalFileAddition.propTypes = propTypes;

export default withTranslation('dtable')(LocalFileAddition);