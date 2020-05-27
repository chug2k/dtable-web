import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { dtableWebAPI } from './utils/dtable-web-api';
import { gettext, siteRoot, mediaUrl, logoPath, logoWidth, logoHeight, siteTitle } from './utils/constants';
import Loading from './components/loading';
import Account from './components/common/account';
import FileViewTip from './components/file-view/file-view-tip';
import PDFViewer from './components/pdf-viewer';
import Audio from './components/file-content-view/audio';
import Image from './components/file-content-view/image';
import Markdown from './components/file-content-view/markdown';
import PDF from './components/file-content-view/pdf';
import SVG from './components/file-content-view/svg';
import Text from './components/file-content-view/text';
import Video from './components/file-content-view/video';
import { Button } from 'reactstrap';

import './css/shared-file-view.css';

let loginUser = window.app.pageOptions.name;
const {
  fileType, err, fileName, filePath, repoID, commitID, downloadUrl
} = window.app.pageOptions;

class FileContent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      errorMsg: '',
    };
  }

  componentDidMount() {
    let queryStatus = () => {
      dtableWebAPI.queryOfficeFileConvertStatus(repoID, commitID, filePath, fileType.toLowerCase()).then((res) => {
        const convertStatus = res.data['status'];
        switch (convertStatus) {
          case 'QUEUED':
          case 'PROCESSING':
            this.setState({
              isLoading: true
            });
            setTimeout(queryStatus, 2000);
            break;
          case 'ERROR':
            this.setState({
              isLoading: false,
              errorMsg: gettext('Document convertion failed.')
            });
            break;
          case 'DONE':
            this.setState({
              isLoading: false,
              errorMsg: ''
            });
            break;
          default:
            break;
        }
      }).catch((error) => {
        if (error.response) {
          this.setState({
            isLoading: false,
            errorMsg: gettext('Document convertion failed.')
          });
        } else {
          this.setState({
            isLoading: false,
            errorMsg: gettext('Please check the network.')
          });
        }
      });
    };
    queryStatus();
  }

  setIframeHeight = (e) => {
    const iframe = e.currentTarget;
    iframe.height = iframe.contentDocument.body.scrollHeight;
  }

  render() {
    const { isLoading, errorMsg } = this.state;
    if (isLoading) {
      return <Loading />;
    }
    if (errorMsg) {
      return <FileViewTip errorMsg={errorMsg} />;
    }
    return (
      <Fragment>
        {
          fileType === 'Document' ?
            <div className="flex-1 pdf-file-view">
              <PDFViewer />
            </div> :
            <div className="shared-file-view-body spreadsheet-file-view">
              <iframe id="spreadsheet-container" title={fileName} src={`${siteRoot}office-convert/static/${repoID}/${commitID}${encodeURIComponent(filePath)}/index.html`} onLoad={this.setIframeHeight}></iframe>
            </div>
        }
      </Fragment>
    );
  }
}

class DTableAssetFileView extends React.Component {

  onDownloadFile = () => {
    location.href = downloadUrl;
  }

  render() {
    let renderItem;

    if (err) {
      renderItem = <FileViewTip />;
    } else {
      switch (fileType) {
        case 'Audio':
          renderItem = <Audio />;
          break;
        case 'Document':
        case 'SpreadSheet':
          renderItem = <FileContent />;
          break;
        case 'Image':
          renderItem = <Image />;
          break;
        case 'Markdown':
          renderItem = <Markdown />;
          break;
        case 'PDF':
          renderItem = <PDF />;
          break;
        case 'SVG':
          renderItem = <SVG />;
          break;
        case 'Text':
          renderItem = <Text />;
          break;
        case 'Video':
          renderItem = <Video />;
          break;
        default:
          renderItem = (
            <FileViewTip />
          );
      }
    }

    return (
      <div className="shared-file-view-md">
        <div className="dtable-asset-view-md-header d-flex">
          <a href={siteRoot}>
            <img src={mediaUrl + logoPath} height={logoHeight} width={logoWidth} title={siteTitle} alt="logo" />
          </a>
          { loginUser && <Account /> }
        </div>
        <div className="dtable-asset-view-md-main py-5">
          <div className="dtable-asset-view-head">
            <div className="float-left">
              <h2 className="ellipsis" title={fileName}>{fileName}</h2>
            </div>
            <div className="float-right">
              <Button color="outline-primary" onClick={this.onDownloadFile}>{gettext('Download')}</Button>
            </div>
          </div>
          {renderItem}
        </div>
      </div>
    );
  }
}

ReactDOM.render (
  <DTableAssetFileView />,
  document.getElementById('wrapper')
);
