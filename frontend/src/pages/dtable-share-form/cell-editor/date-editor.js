import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Calendar from '@seafile/seafile-calendar';
import { withTranslation } from 'react-i18next';
import MediaQuery from 'react-responsive';
import DateEditorView from '../cell-viewer-mobile/date-editor-view';
import ClickOutside from '../cell-editor-widgets/click-outside';
import DatePicker from '@seafile/seafile-calendar/lib/Picker';
import { translateCalendar } from '../utils/date-format-utils';
import { gettext } from '../../../utils/constants';
import 'moment/locale/zh-cn';
import 'moment/locale/en-gb';
import '@seafile/seafile-calendar/assets/index.css';
import '../css/date-editor.css';

const now = moment();

const propTypes = {
  isReadOnly: PropTypes.bool,
  value: PropTypes.string,
  column: PropTypes.object,
  onCommit: PropTypes.func,
  t: PropTypes.func,
};

class DataEditor extends React.Component {

  static defaultProps = {
    isReadOnly: false,
    value: '',
    defaultCalendarValue: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      isDateInit: false,
      isPopoverShow: false,
      newValue: null,
      dateFormat: 'YYYY-MM-DD',
      showHourAndMinute: false,
      defaultCalendarValue: null,
    };

    this.calendarContainerRef = React.createRef();
  }

  componentDidMount() {
    const iszhcn = (window.app.config && window.app.config.lang === 'zh-cn');
    iszhcn ? moment.locale('zh-cn') : moment.locale('en-gb');
    const { value } = this.props;
    let dateFormat = this.getDateFormat();
    this.setState({
      isDateInit: true,
      newValue: value && (iszhcn ? moment(value).locale('zh-cn') : moment(value).locale('en-gb')),
      dateFormat: dateFormat,
      showHourAndMinute: dateFormat.indexOf('HH:mm') > -1,
      defaultCalendarValue: now.clone(),
    });
  }

  onClickOutside = () => {
    this.setState({isPopoverShow: false, open: false});
  }

  getFormatValue = (value) => {
    if (!value) {
      return null;
    }
    return moment(value);
  }

  getDateFormat = () => {
    let { column } = this.props;
    let defaultDateFormat = 'YYYY-MM-DD';
    let dateFormat = column.data && column.data.format;
    return dateFormat || defaultDateFormat;
  }

  onCommit = (value) => {
    let updated = {};
    let { column } = this.props;
    updated[column.key] = value;
    this.props.onCommit(updated);
  }

  onDateEditorToggle = () => {
    if (this.props.isReadOnly) {
      return;
    }
    this.setState({
      isPopoverShow: !this.state.isPopoverShow,
      open: !this.state.open
    });
  }

  onFocusDatePicker = () => {
    this.setState({open: true});
  }

  handleMouseDown = (event) => {
    event.stopPropagation();
  }

  onChange = (value) => {
    if (!value) return;
    let { showHourAndMinute } = this.state;
    this.setState({newValue: value}, () => {
      let storageFormat = showHourAndMinute ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
      value = value && value.format(storageFormat);
      this.onCommit(value);
    });
  }

  onOpenChange = (open) => {
    if (!this.state.showHourAndMinute) {
      this.setState({
        isPopoverShow: open,
        open: open
      });
    }
  }

  getCalendarContainer = () => {
    return this.calendarContainerRef.current;
  }

  onClear = () => {
    this.setState({
      isPopoverShow: false,
      open: false,
    });
  }

  getCalender = () => {
    return (
      <Calendar 
        locale={translateCalendar()}
        style={{ zIndex: 1001 }}
        format={this.getDateFormat()}
        defaultValue={this.state.defaultCalendarValue}
        showDateInput={true}
        dateInputPlaceholder={gettext('Please input')}
        focusablePanel={false}
        showHourAndMinute={this.state.showHourAndMinute}
        onClear={this.onClear}
      />
    );
  }

  render() {
    if (!this.state.isDateInit) {
      return (
        <div className="cell-editor grid-cell-type-date">
          <div className="date-editor-conteinr">
            <div className="control-form"></div>
          </div>
        </div>
      );
    }

    let calendar = this.getCalender();
    let state = this.state;
    let value = state.newValue ? state.newValue.format(this.getDateFormat()) : '';

    let datePickerValue = state.newValue || null;
    return (
      <ClickOutside onClickOutside={this.onClickOutside}>
        <div className="cell-editor grid-cell-type-date">
          {!this.state.isPopoverShow && (
            <div className="date-editor-container" style={{width: 320}} onClick={this.onDateEditorToggle}>
              <div className="form-control">{value || ''}</div>
            </div>
          )}
          <MediaQuery query="(min-width: 768px)">
            {this.state.isPopoverShow && (
              <DatePicker 
                open={state.open}
                value={datePickerValue}
                animation="slide-up"
                style={{ zIndex: 1001 }}
                calendar={calendar}
                getCalendarContainer={this.getCalendarContainer}
                onChange={this.onChange}
                onOpenChange={this.onOpenChange}
              >
                {({value}) => {
                  value = value && (value.format(this.getDateFormat()) || '');
                  return (
                    <span className="date-editor-container" tabIndex="0" onFocus={this.onFocusDatePicker}>
                      <input
                        placeholder={gettext('Please select')}
                        readOnly
                        tabIndex="-1"
                        className="ant-calendar-picker-input ant-input form-control"
                        value={value || ''}
                        onMouseDown={this.handleMouseDown}
                      />
                      <div ref={this.calendarContainerRef} />
                    </span>
                  );
                }}
              </DatePicker>
            )}
          </MediaQuery>
          <MediaQuery query="(max-width: 767.8px)">
            {this.state.isPopoverShow &&
              <div className="cell-viewer-mobile-mask">
                <DateEditorView
                  column={this.props.column}
                  value={value}
                  onCommit={this.props.onCommit}
                  closeEditor={this.onDateEditorToggle}
                  onChange={this.onChange}
                />
              </div>
            }
          </MediaQuery>
        </div>
      </ClickOutside>
    );
  }
}

DataEditor.propTypes = propTypes;

export default withTranslation('dtable') (DataEditor);
