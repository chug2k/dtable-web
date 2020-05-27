import React from 'react';
import ReactDOM from 'react-dom';
import AppMain from './pages/dtable-share-row/app-main';

import './css/dtable-share-row.css';

const { rowContent, columns } = window.shared.pageOptions;

class SharedDTableRowView extends React.Component {

  render() {

    return (
      <AppMain row={JSON.parse(rowContent)['row']} columns={JSON.parse(columns)['columns']}/>
    );
  }

}

ReactDOM.render(
  <SharedDTableRowView />,
  document.getElementById('wrapper')
);