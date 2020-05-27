import React from 'react';
import ReactDOM from 'react-dom';
import AppMain from './pages/dtable-edit-form/app-main';

import './css/dtable-edit-form.css';

const { dtableMetadata, formConfig } = window.shared.pageOptions;

class DtableEditFormView extends React.Component {

  render() {
    let formConfigInfo = JSON.parse(formConfig);
    let metadata = JSON.parse(dtableMetadata).metadata;
    let tables = metadata.tables;
    return <AppMain tables={tables} formConfigInfo={formConfigInfo} />;
  }
}

ReactDOM.render(
  <DtableEditFormView />,
  document.getElementById('wrapper')
);
