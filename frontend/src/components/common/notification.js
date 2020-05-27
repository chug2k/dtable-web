import React from 'react';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import { gettext, siteRoot } from '../../utils/constants';
import NoticeItem from './notice-item';

class Notification extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showNotice: false,
      unseenCount: 0,
      noticeList: [],
    };
  }

  componentDidMount() {
    dtableWebAPI.getUnseenNotificationCount().then(res => {
      this.setState({unseenCount: res.data.unseen_count});
    });
  }

  onClick = () => {
    if (this.state.showNotice) {
      dtableWebAPI.updateNotifications();
      this.setState({
        showNotice: false,
        unseenCount: 0
      });
    } else {
      this.loadNotices();
      this.setState({showNotice: true});
    }
  }

  loadNotices = () => {
    let page = 1;
    let perPage = 5;
    dtableWebAPI.listNotifications(page, perPage).then(res => {
      let noticeList = res.data.notification_list;
      this.setState({noticeList: noticeList});
    });
  }

  onNoticeItemClick = (noticeItem) => {    
    let noticeList = this.state.noticeList.map(item => {
      if (item.id === noticeItem.id) {
        item.seen = true;
      }
      return item;
    });
    dtableWebAPI.markNoticeAsRead(noticeItem.id);
    let unseenCount = this.state.unseenCount === 0 ? 0 : this.state.unseenCount - 1;
    this.setState({
      noticeList: noticeList,
      unseenCount: unseenCount, 
    });
    
  }

  render() {

    return (
      <div id="notifications">
        <span onClick={this.onClick} className="no-deco a-simulate" id="notice-icon" title="Notifications" aria-label="Notifications">
          <span className="dtable-font dtable-icon-bell"></span>
          <span className={`num ${this.state.unseenCount ? '' : 'hide'}`}>{this.state.unseenCount}</span>
        </span>
        <div id="notice-popover" className={`sf-popover ${this.state.showNotice ? '': 'hide'}`}>
          <div className="outer-caret up-outer-caret"><div className="inner-caret"></div></div>
          <div className="sf-popover-hd ovhd">
            <h3 className="sf-popover-title title">{gettext('Notifications')}</h3>
            <span onClick={this.onClick} title={gettext('Close')} aria-label={gettext('Close')} className="a-simulate sf-popover-close js-close dtable-font dtable-icon-x- action-icon float-right"></span>
          </div>
          <div className="sf-popover-con">
            <ul className="notice-list">
              {this.state.noticeList.map(item => {
                return (<NoticeItem key={item.id} noticeItem={item} onNoticeItemClick={this.onNoticeItemClick}/>);
              })}
            </ul>
            <a href={siteRoot + 'notification/list/'} className="view-all">{gettext('See All Notifications')}</a>
          </div>
        </div>
      </div>
    );
  }
}

export default Notification;
