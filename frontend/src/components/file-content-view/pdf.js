import React from 'react';
import PDFViewer from '../pdf-viewer';

import '../../css/pdf-file-view.css';

class FileContent extends React.Component {
  render() {
    return (
      // todo
      <div className="flex-1 pdf-file-view">
        <PDFViewer />
      </div>
    );
  }
}

export default FileContent;
