import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import RowItem from './row-item';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import Loading from '../../components/loading';
import toaster from '../../components/toast';
import { Utils } from '../../utils/utils';
import EndRemark from '../../components/end-remarks';
import RemarkItem from './remark-item';
import './css/end-remark.css';

const gettext = window.gettext;
const { formToken } = window.shared.pageOptions;

const propTypes = {
  formConfig: PropTypes.object.isRequired,
};

class AppMain extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isDataLoading: true,
      isDateUpdated: false,
      table_id: '',
      columns: [],
      form_name: '',
      isShowEndRemark: false
    };
    this.rowData = {};
  }

  componentDidMount() {
    let formConfig = this.props.formConfig;
    this.setState({
      isDataLoading: false,
      table_id: formConfig.table_id,
      columns: formConfig.columns,
      form_name: formConfig.form_name,
      remarkContent: formConfig.remarkOption ? formConfig.remarkOption.remarkContent : ''
    });
  }

  onCommit = (updated) => {
    this.rowData = Object.assign({}, this.rowData, updated);
    this.setState({isDateUpdated: true});
  }

  onSubmit = () => {
    dtableWebAPI.submitFormData(formToken, this.state.table_id, JSON.stringify(this.rowData)).then(res => {
      this.setState({
        isShowEndRemark: true
      });
    }).catch(error => {
      let errorMessage = Utils.getErrorMsg(error);
      toaster.danger(errorMessage);
    });
  }

  getRowItems = () => {
    let { columns, remarkContent } = this.state;
    let rowItems = [];
    const disabledType = ['formula', 'link', 'collaborator', 'creator', 'ctime'];
    for (let key in columns) {
      let column = columns[key];
      if (disabledType.includes(column.type)) {
        continue;
      }
      let item = <RowItem key={key} column={column} onCommit={this.onCommit} />;
      rowItems.push(item);
    }
    if (remarkContent) {
      let remarkItem = <RemarkItem remarkContent={remarkContent} key="remark-item" />;
      rowItems.push(remarkItem);
    }
    return rowItems;
  }
  
  render() {
    if (this.state.isDataLoading) {
      return <Loading />;
    }

    if (this.state.isShowEndRemark) {
      let content = gettext('Thank you for submit the form!');
      return <EndRemark content={content}/>;
    }

    let items = this.getRowItems();

    return (
      <Fragment>
        <div className="form-header">
          <h3 className="form-header-title">{this.state.form_name}</h3>
        </div>
        <div className="form-content">
          <div className="form-items-container">
            {items}
            <button className="btn btn-primary mb-4 mt-4 flex-shrink-0" onClick={this.onSubmit} disabled={!this.state.isDateUpdated}
              style={{width: '5rem'}}>{gettext('Submit')}</button>
          </div>
        </div>
      </Fragment>
    );
  }
}

AppMain.propTypes = propTypes;

export default AppMain;
