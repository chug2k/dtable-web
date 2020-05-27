import React, { Suspense, Fragment }  from 'react';
import ReactDOM from 'react-dom';
import AppMain from './pages/dtable-share-form/app-main';
import AppMainMobile from './pages/dtable-share-form/app-main-mobile';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n-dtable';
import MediaQuery from 'react-responsive';
import Loading from './components/loading';
import './css/dtable-share-form.css';

const gettext = window.gettext;
const { dtableMetadata, formConfig } = window.shared.pageOptions;

class DTableFormView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      formConfigData: JSON.parse(formConfig),
    };
  }

  componentDidMount() {
    let { formConfigData } = this.state;
    let tables = JSON.parse(dtableMetadata).metadata.tables;
    
    try {
      let currentTable = tables.find(table => { return table._id === formConfigData.table_id; });
      let serverColumns = currentTable.columns;
      let dbColumns = formConfigData.columns;
      let keys = dbColumns.map(column => {
        return column.key;
      });
  
      let columns = serverColumns.filter(column => {
        return keys.find(key => { return key === column.key; });
      });
      
      formConfigData.columns = columns;
  
      this.setState({
        isLoading: false,
        formConfigData: formConfigData
      });
    } catch(err) {
      let errorMessage = gettext('The form you want to access has not been created.');
      this.setState({
        isLoading: false,
        errorMessage: errorMessage
      });
    }
  }

  render() {

    let { isLoading, formConfigData, errorMessage } = this.state;

    if (isLoading) {
      return <Loading />;
    }

    if (errorMessage) {
      return <p className="text-center mt-8 error">{errorMessage}</p>;
    }

    return (
      <Fragment>
        <MediaQuery query="(max-width: 767.8px)">
          <div id="main" className='app-main-mobile'>
            <AppMainMobile formConfig={formConfigData} />
          </div>
        </MediaQuery>
        <MediaQuery query="(min-width: 767.8px)">
          <div id="main">
            <AppMain formConfig={formConfigData} />
          </div>
        </MediaQuery>
      </Fragment>
    );
  }
}

ReactDOM.render(
  <I18nextProvider i18n={i18n}>
    <Suspense fallback={<Loading/>}>
      <DTableFormView />
    </Suspense>
  </I18nextProvider>,
  document.getElementById('wrapper')
);
