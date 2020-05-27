import React from 'react';
import PropTypes from 'prop-types';
import Loading from '../../components/loading';
import FormSettingItem from './widgets/form-setting-item';
import SettingSendNotication from './widgets/setting-send-notification';
import SettingFormShare from './widgets/setting-form-share';
import SettingRemarks from './widgets/setting-remarks';
import Select from './select';
import { dtableWebAPI } from '../../utils/dtable-web-api';

const gettext = window.gettext;

const { workspaceID, dtableName, shareType, sharedGroups } = window.shared.pageOptions;

const propTypes = {
  tables: PropTypes.array.isRequired,
  onSubmitForm: PropTypes.func.isRequired,
  onColumnChanged: PropTypes.func.isRequired,
  onRemarkChange: PropTypes.func.isRequired,
  onChangeRemarkShow: PropTypes.func.isRequired,
  onSettingBeginSaving: PropTypes.func.isRequired,
  formConfigInfo: PropTypes.object.isRequired,
};

class AppFormSetting extends React.Component {

  constructor(props) {
    super(props);
    const tableId = props.formConfigInfo.table_id;
    this.state = {
      isSettingsLoaded: false, 
      tableSettings: [],
      columnSettings: [],
      activeTable: this.findActiveTable(tableId),
      isSendNotification: false,
      notificationSelectedUsers: [],
      relatedUsers: [],
      shareType: shareType,
      allGroups: [],
      selectedGroups: JSON.parse(sharedGroups),
    };
    this.isSettingChanged = false;
    this.timer = null;
  }

  componentDidMount() {
    let { tables, formConfigInfo } = this.props;
    let table_id = formConfigInfo.table_id;
    let activeTable = tables[0];
    let columns = activeTable.columns;
    if (table_id) {
      activeTable = tables.find(table => { return table['_id'] === table_id;});
      let configColumns = formConfigInfo.columns;
      let columnKeys = configColumns.map(column => { return column.key;});
      let allColumns = activeTable.columns;
      columns = allColumns.filter(column => {
        return columnKeys.indexOf(column.key) > -1;
      });
    }
    this.initFormSetting(activeTable, columns, formConfigInfo.notification_config);
    window.onbeforeunload = this.onBeforeUnload;
  }

  componentWillUnmount() {
    window.onbeforeunload = null;
  }

  onBeforeUnload = () => {
    if (this.isSettingChanged && this.timer) {
      this.onSubmitForm();
      this.isSettingChanged = false;
      clearTimeout(this.timer);
      this.timer = null;
      return '';
    }
  }

  initFormSetting = (activeTable, selectedColumns, notificationConfig) => {
    const selectedColumnKeys = selectedColumns ? selectedColumns.map((column) => { return column.key; }) : null;
    const disabledType = ['formula', 'link', 'collaborator', 'creator', 'ctime'];
    let columnSettings = [];
    activeTable.columns.forEach((column) => {
      let { key, name, type } = column;
      if (!disabledType.includes(type)) {
        let columnSetting = { key, name, type, flag: selectedColumnKeys ? selectedColumnKeys.includes(column.key) : true };
        columnSettings.push(columnSetting);
      }
    });
    let isSendNotification = false;
    let notificationSelectedUsers = [];
    if (notificationConfig) {
      isSendNotification = notificationConfig.is_send_notification || false;
      notificationSelectedUsers =  notificationConfig.notification_selected_users === [] ? false :
        notificationConfig.notification_selected_users;
    }
    dtableWebAPI.getTableRelatedUsers(workspaceID, dtableName).then(res => {
      let relatedUsers = res.data ? res.data.user_list : [];
      this.setState({
        columnSettings,
        activeTable,
        relatedUsers,
        isSendNotification,
        notificationSelectedUsers,
        isSettingsLoaded: true,
      }, () => {
        this.onSubmitForm();
      });
    });
    this.listGroups();
  }

  listGroups = () => {
    dtableWebAPI.listGroups().then(res => {
      this.setState({
        allGroups: res.data,
      });
    });
  }

  findActiveTable = (table_id) => {
    let activeTable = this.props.tables.find((table) => {
      return table._id === table_id;
    });
    if (!activeTable) return null;
    return activeTable;
  }

  createTableOptions = () => {
    let { tables } = this.props;
    return tables.map(table => {
      return this.createTableOption(table);
    });
  }

  createTableOption = (table) => {
    return ({
      value: { _id: table._id },
      label: (<span className='select-option-name'>{table.name}</span>)
    });
  }

  onTableSelectedChanged = (selectedItem) => {
    let { tables } = this.props;
    let currentTable = tables.find((table) => {
      return table._id === selectedItem._id;
    });
    this.caculateColumnSettings(currentTable);
    this.onSave();
  }

  caculateColumnSettings = (currentTable) => {
    let columnSettings = currentTable.columns.map(column => {
      return {
        key: column.key,
        name: column.name,
        type: column.type,
        flag: true,
      };
    });
    const disabledType = ['formula', 'link', 'collaborator', 'creator', 'ctime'];
    columnSettings = columnSettings.filter(columnSetting => {
      return !disabledType.includes(columnSetting.type);
    });
    let newCurrrentColumns = currentTable.columns.filter(column => {
      return !disabledType.includes(column.type);
    });
    this.setState({
      columnSettings: columnSettings,
      activeTable: currentTable,
    });
    this.props.onColumnChanged(newCurrrentColumns);
  }

  onColumnItemClick = (key, flag) => {
    let { columnSettings, activeTable } = this.state;
    let newColumnSettings = columnSettings.map(column => {
      if (column.key === key) {
        column.flag = flag;
      }
      return column;
    });
    const disabledType = ['formula', 'link', 'collaborator', 'creator', 'ctime'];
    let newCurrrentColumns = activeTable.columns.filter(column => {
      if (disabledType.indexOf(column.type) > -1) {
        return false;
      }
      let settingItem = columnSettings.find(settingColumn => {
        return settingColumn.key === column.key;
      });
      return settingItem.flag;
    });
    this.setState({columnSettings: newColumnSettings});
    this.props.onColumnChanged(newCurrrentColumns);
    this.onSave();
  }

  onSave = () => {
    this.props.onSettingBeginSaving();
    if (!this.isSettingChanged && !this.timer) {
      this.isSettingChanged = true;
      this.timer = setTimeout(() => {
        this.onSubmitForm();
        this.isSettingChanged = false;
        clearTimeout(this.timer);
        this.timer = null;
      }, 3000);
    }
  }

  onSubmitForm = () => {
    let configTableId = this.state.activeTable._id;
    let { shareType, selectedGroups } = this.state;
    if (shareType !== 'shared_groups') {
      selectedGroups = [];
      this.setState({selectedGroups: selectedGroups});
    }
    let notificationConfig = {
      is_send_notification: this.state.isSendNotification,
      notification_selected_users: this.state.notificationSelectedUsers
    };
    this.props.onSubmitForm(configTableId, notificationConfig, shareType, selectedGroups);
  }

  closeSendNotification = () => {
    this.setState({isSendNotification: false}, () => {
      this.onSave();
    });
  }

  openSendNotification = () => {
    this.setState({isSendNotification: true}, () => {
      this.onSave();
    });
  }

  handleNotificationSelectUserChange = (options) => {
    this.setState({ notificationSelectedUsers: options }, () => {
      this.onSave();
    });
  };

  handleShareSelectGroupChange = (options) => {
    this.setState({ selectedGroups: options }, () => {
      this.onSave();
    });
  };

  handleShareTypeChange = (shareType) => {
    this.setState({ shareType: shareType }, () => {
      this.onSave();
    });
  };

  render() {
    if (!this.state.isSettingsLoaded) {
      return <Loading />;
    }
    const { onRemarkChange, onChangeRemarkShow, formConfigInfo } = this.props;
    let { activeTable, columnSettings, isSendNotification, notificationSelectedUsers, relatedUsers, 
      shareType, allGroups, selectedGroups } = this.state;
    return (
      <div className="app-form-setting">
        <div className="setting-header">
          <div className="setting-header-title">{gettext('Form Settings')}</div>
        </div>
        <div className="setting-body">
          <div className="table-setting">
            <div className="title">{gettext('Table')}</div>
            <Select
              value={this.createTableOption(activeTable)}
              options={this.createTableOptions()}
              onSelectOption={this.onTableSelectedChanged}
            />
          </div>
          <div className="table-setting-divider"></div>
          <div className="table-setting">
            <div className="title">{gettext('Fields')}</div>
            <div className="setting-list-container">
              {columnSettings.map(columnSetting => {
                return (
                  <FormSettingItem
                    key={columnSetting.key}
                    columnSetting={columnSetting}
                    onColumnItemClick={this.onColumnItemClick}
                  />
                );
              })}
            </div>
          </div>
          <div className="table-setting-divider"></div>
          <SettingSendNotication
            selectedUsers={notificationSelectedUsers}
            relatedUsers={relatedUsers}
            onCommit={this.handleNotificationSelectUserChange}
            closeSendNotification={this.closeSendNotification}
            openSendNotification={this.openSendNotification}
            isSendNotification={isSendNotification}
          />
          <div className="table-setting-divider"></div>
          <SettingFormShare
            shareType={shareType}
            handleShareTypeChange={this.handleShareTypeChange}
            allGroups={allGroups}
            selectedGroups={selectedGroups}
            onCommit={this.handleShareSelectGroupChange}
          />
          <div className="table-setting-divider"></div>
          <SettingRemarks 
            onRemarkChange={onRemarkChange}
            onChangeRemarkShow={onChangeRemarkShow}
            onSubmitForm={this.onSubmitForm}
            remarkOption={formConfigInfo.remarkOption}
          />
        </div>
      </div>
    );
  }
}

AppFormSetting.propTypes = propTypes;

export default AppFormSetting;
