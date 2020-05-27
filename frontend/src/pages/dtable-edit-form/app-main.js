import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'reactstrap';
import Loading from '../../components/loading';
import toaster from '../../components/toast';
import { Utils } from '../../utils/utils';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import AppFormContent from './app-form-content';
import AppFormSetting from './app-form-setting';

const gettext = window.gettext;
const { formToken, dtableWebURL } = window.shared.pageOptions;

const propTypes = {
  tables: PropTypes.array.isRequired,
  formConfigInfo: PropTypes.object.isRequired,
};

class AppMain extends React.Component {

  constructor(props) {
    super(props);
    const { remarkOption, form_name } = props.formConfigInfo;
    this.state = {
      isColumnsLoaded: false,
      currentColumns: null,
      onRenameToggle: false,
      formName: form_name,
      isSaving: false,
      isSaved: false,
      remarkContent: remarkOption ? remarkOption.remarkContent : null,
      isRemarkContentShow: remarkOption ? remarkOption.isRemarkContentShow : true
    };
  }

  componentDidMount() {
    let { tables, formConfigInfo } = this.props;
    let tableId = formConfigInfo.table_id;
    let columns = tables[0].columns;
    if (tableId) {
      // current operation is update the form settings
      let editTable = tables.find(table => { return table._id === tableId; });
      let configColumns = formConfigInfo.columns;
      let columnKeys = configColumns.map(column => { return column.key;});
      let allColumns = editTable.columns;
      columns = allColumns.filter(column => {
        return columnKeys.indexOf(column.key) > -1;
      });
    }
    this.setState({
      currentColumns: columns,
      isColumnsLoaded: true
    });
  }

  onSettingBeginSaving = () => {
    this.setState({ isSaving: true, isSaved: false });
  }

  onSettingEndSaving = () => {
    this.setState({ isSaving: false, isSaved: true });
    setTimeout(() => {
      this.setState({ isSaving: false, isSaved: false });
    }, 2000);
  }

  onColumnChanged = (newColumns) => {
    this.setState({currentColumns: newColumns});
  }

  onSubmitForm = (configTableId, notificationConfig, shareType, selectedGroups) => {
    let { currentColumns, remarkContent, isRemarkContentShow } = this.state;
    let columns = currentColumns.map(column => {
      return { key: column.key };
    });
    let remarkOption = {
      isRemarkContentShow, remarkContent
    };
    let config = this.props.formConfigInfo;
    config = Object.assign({}, config, {columns: columns, table_id: configTableId, form_name: this.state.formName, notification_config: notificationConfig, remarkOption});
    dtableWebAPI.updateDTableForm(formToken, JSON.stringify(config)).then(res => {
      this.onSettingEndSaving();
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
    let groupIDs = selectedGroups.map(group => group.id);
    dtableWebAPI.dTableFormShare(formToken, shareType, groupIDs).then(res => {
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  getSubmitLink = () => {
    let slicedTableWebURL = dtableWebURL;
    if (slicedTableWebURL.charAt(slicedTableWebURL.length - 1) === '/') {
      slicedTableWebURL = slicedTableWebURL.slice(0, slicedTableWebURL.length - 1);
    }
    return `${slicedTableWebURL}/dtable/forms/${formToken}/`;
  }

  onCheckFormPage = () => {
    window.open(this.getSubmitLink());
  }

  onRemarkChange = (value) => {
    this.setState({remarkContent: value});
  }

  onChangeRemarkShow = (value) => {
    if (!value) {
      this.setState({remarkContent: null});
    }
    this.setState({isRemarkContentShow: value});
  }

  renameToggle = () => {
    this.setState({
      onRenameToggle: !this.state.onRenameToggle,
    });
  }

  onRenameForm =() => {
    let value = event.target.value;
    let { formName } = this.state;
    formName = value.trim() ? value.trim() : formName;
    this.setState({
      onRenameToggle: !this.state.onRenameToggle,
      formName: formName
    });
  }

  render() {
    const { formConfigInfo, tables } = this.props;
    const { isSaved, isSaving, isColumnsLoaded, formName, onRenameToggle, remarkContent, isRemarkContentShow,
      currentColumns } = this.state;
    if (!isColumnsLoaded) {
      return <Loading />;
    }
    return (
      <div className="app-wrapper">
        <div className="app-header">
          <div className="app-title form-table-title">
            {onRenameToggle ? (
              <Input defaultValue={formName} className="edit-form-rename-input" onBlur={this.onRenameForm} autoFocus={true} />
            ) : (
              <React.Fragment>
                <span className="edit-form-name">{formName}</span>
                <span onClick={this.renameToggle} className="dtable-font dtable-icon-rename"></span>
              </React.Fragment>
            )}
            {isSaving && !isSaved && <span className="tip-message">{gettext('Saving...')}</span>}
            {!isSaving && isSaved && <span className="tip-message">{gettext('All changes saved')}</span>}
          </div>
          <button onClick={this.onCheckFormPage} className="btn btn-outline-primary">{gettext('Form Page')}</button>
        </div>
        <div className="app-main">
          <div className="app-content-container">
            <AppFormContent 
              currentColumns={currentColumns} 
              remarkContent={remarkContent} 
              isRemarkContentShow={isRemarkContentShow}
            />
          </div>
          <div className="app-side-container">
            <AppFormSetting
              formConfigInfo={formConfigInfo}
              tables={tables}
              onColumnChanged={this.onColumnChanged}
              onSubmitForm={this.onSubmitForm}
              onRemarkChange={this.onRemarkChange}
              onChangeRemarkShow={this.onChangeRemarkShow}
              onSettingBeginSaving={this.onSettingBeginSaving}
            />
          </div>
        </div>
      </div>
    );
  }
}

AppMain.propTypes = propTypes;

export default AppMain;
