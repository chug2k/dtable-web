import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { DatePicker } from 'antd-mobile';
import Calendar from '@seafile/seafile-calendar';
import * as SeaDatePicker from '@seafile/seafile-calendar/lib/Picker';
import * as zIndexes from '../utils/zIndexes';
import { translateCalendar } from '../utils/date-format-utils';
import { gettext } from '../../../utils/constants';
import MobileCommonHeader from './mobile-common-header';
import '@seafile/seafile-calendar/assets/index.css';
import 'moment/locale/zh-cn';
import 'moment/locale/en-gb';

const propTypes = {
  column: PropTypes.object,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onCommit: PropTypes.func,
  onChange: PropTypes.func,
  closeEditor: PropTypes.func,
};

const now = moment();

class DateEditorView extends React.PureComponent {

  constructor(props) {
    super(props);
    this.showTime = props.column.data ? props.column.data.format === 'YYYY-MM-DD HH:mm': false;
    this.state = {
      time: null,
      defaultCalendarValue: null,
    };
    this.calendarContainerRef = React.createRef();
  }

  componentDidMount() {
    history.pushState(null, null, '#');
    window.addEventListener('popstate', this.handleHistaryBack, false);
    let { value } = this.props;
    const iszhcn = (window.app.config && window.app.config.lang === 'zh-cn');
    if (iszhcn) {
      now.locale('zh-cn');
    } else {
      now.locale('en-gb');
    }
    if (!value) {
      value = new Date(Date.now());
    }
    this.setState({
      defaultCalendarValue: now.clone(),
      time: iszhcn ? moment(value).locale('zh-cn') : moment(value).locale('en-gb')
    });
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handleHistaryBack, false);
  }

  handleHistaryBack = (e) => {
    e.preventDefault();
    this.props.closeEditor();
  }

  handleDateChange = (date) => {
    if (this.showTime) {
      const HM = moment(this.state.time).format('HH:mm');
      const newTime = moment(date).format('YYYY-MM-DD') + ' ' + HM;
      this.setState({ time: new Date(newTime) });
    }
    else {
      this.setState({ time: date });
    }
  }

  handleTimeChange = (time) => {
    const YMD = moment(this.state.time).format('YYYY-MM-DD');
    const newTime = YMD + ' ' + moment(time).format('HH:mm');
    this.setState({ time: new Date(newTime) });
  }

  closeEditor = () => {
    this.props.closeEditor();
  }

  deleteDate = () => {
    this.props.onChange(null);
    this.props.closeEditor();
  }

  getCalendarContainer = () => {
    return this.calendarContainerRef.current;
  }

  getFormat = (showHour) => {
    return showHour ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
  }

  onChange = (value) => {
    if (!value) return;
    const newTime = value.format(this.getFormat(this.showTime));
    this.setState({ time: newTime });
    this.props.onChange(value);
  }

  renderCalendar() {
    const { time } = this.state;
    const calendar = (
      <Calendar
        locale={translateCalendar()}
        dateInputPlaceholder={gettext('Please input date')}
        format={this.getFormat(this.showTime)}
        defaultValue={this.state.defaultCalendarValue}
        showDateInput={false}
        focusablePanel={false}
        showToday={false}
        showTime={false}
        style={{width: '100%', fontSize: '14px'}}
      />
    );
    return (
      <div className="date-picker-container">
        <SeaDatePicker
          calendar={calendar}
          value={moment(time)}
          onChange={this.onChange}
          getCalendarContainer={this.getCalendarContainer}
          open={true}
          style={{width: '100%'}}
        >
          {({ time }) => {
            return (
              <div tabIndex="0" onFocus={this.onReadOnlyFocus}>
                <input
                  placeholder={gettext('Please select')}
                  readOnly
                  tabIndex="-1"
                  className="ant-calendar-picker-input ant-input form-control"
                  value={time ? moment(time).format(this.getFormat(this.showTime)) : ''}
                />
                <div ref={this.calendarContainerRef} style={{height: '22rem'}}/>
              </div>
            );
          }}
        </SeaDatePicker>
      </div>
    );
  }

  render() {
    const { column } = this.props;
    return (
      <div className="row-expand-view date-editor-view" style={{ zIndex: zIndexes.ROW_EXPAND_VIEW }}>
        <MobileCommonHeader
          title={column.name}
          onLeftClick={this.closeEditor}
          leftName={(<i className="dtable-font dtable-icon-return"></i>)}
        />
        <div className="date-input" style={this.showTime ? { width: '50%' } : { width: '100%' }}>
          <DatePicker mode="date" value={this.state.value} onChange={this.handleDateChange}>
            <div className="date-input-day">{moment(this.state.time).format('YYYY-MM-DD')}</div>
          </DatePicker>
        </div>
        {this.showTime &&
          <div className="date-input" style={{ width: '50%' }}>
            <DatePicker mode="time" value={this.state.value} onChange={this.handleTimeChange}>
              <div className="date-input-day">{moment(this.state.time).format('HH:mm')}</div>
            </DatePicker>
          </div>
        }
        <div className="view-partition view-partition-border-top view-partition-border-bottom"></div>
        {this.renderCalendar()}
        <div className="row-expand-view-footer">
          <div onClick={this.deleteDate} className="clear-date">{gettext('Clear')}</div>
        </div>
      </div>
    );
  }
}

DateEditorView.propTypes = propTypes;

export default DateEditorView;