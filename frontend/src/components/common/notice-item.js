import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { gettext, siteRoot, lang } from '../../utils/constants';

moment.locale(lang);

const propTypes = {
  noticeItem: PropTypes.object.isRequired,
  onNoticeItemClick: PropTypes.func.isRequired,
};

const MSG_TYPE_ADD_USER_TO_GROUP = 'add_user_to_group';
const MSG_TYPE_SHARE_DTABLE_TO_USER = 'share_dtable_to_user';
const MSG_TYPE_SUBMIT_FORM = 'submit_form';

class NoticeItem extends React.Component {

  generatorNoticeInfo () {
    let noticeItem = this.props.noticeItem;
    let noticeType = noticeItem.type;
    let detail = noticeItem.detail;

    if (noticeType === MSG_TYPE_SHARE_DTABLE_TO_USER) {
      let avatar_url = detail.share_from.share_from_user_avatar_url;

      let shareFrom = detail.share_from.share_from_user_name;

      let dtableName = detail.dtable.name;
      let dtableUrl = siteRoot + 'workspace/' + detail.dtable.workspace_id + '/dtable/' +  dtableName + '/';
      let dtableLink = '<a href="' + dtableUrl + '" >' + dtableName + '</a>';

      let notice = gettext('{share_from} has shared a table named {dtable_link} to you.');

      notice = notice.replace('{share_from}', shareFrom);
      notice = notice.replace('{dtable_link}', dtableLink);
      return {avatar_url, notice};
    }

    else if (noticeType === MSG_TYPE_SUBMIT_FORM) {
      const { form, submit_user } = detail;
      const { form_name } = form;
      const { submit_user_avatar_url: avatar_url, submit_user_name } = submit_user;
      let notice;
      if (!submit_user_name) {
        notice = gettext('Anonymous user has submmited form {formName}.');
        notice = notice.replace('{formName}', form_name);
      } else {
        notice = gettext('{submitUser} has submmited form {formName}.');
        notice = notice.replace('{submitUser}', submit_user_name).replace('{formName}', form_name);
      }
      return {avatar_url, notice};
    }

    else if (noticeType === MSG_TYPE_ADD_USER_TO_GROUP) {

      let avatar_url = detail.group_staff_avatar_url;

      let groupStaff = detail.group_staff_name;
      
      let userHref = siteRoot + 'profile/' + detail.group_staff_email + '/';
      let groupName = detail.group_name;

      let notice = gettext('{user_link} has added you to {group}');
      let userLink = '<a href=' + userHref + '>' + groupStaff + '</a>';

      notice = notice.replace('{user_link}', userLink);
      notice = notice.replace('{group}', groupName);

      return {avatar_url, notice};
    }
    
    return {avatar_url : null, notice : null};
  }

  onNoticeItemClick = () => {
    let item = this.props.noticeItem;
    if (item.seen === true) {
      return;
    }
    this.props.onNoticeItemClick(item);
  }

  render() {
    let noticeItem = this.props.noticeItem;
    let { avatar_url, notice } = this.generatorNoticeInfo();

    if (!avatar_url && !notice) {
      return '';
    }

    return (
      <li onClick={this.onNoticeItemClick} className={noticeItem.seen ? 'read' : 'unread'}>
        <div className="notice-item">
          <div className="main-info">
            <img src={avatar_url} width="32" height="32" className="avatar" alt=""/>
            <p className="brief" dangerouslySetInnerHTML={{__html: notice}}></p>
          </div>
          <p className="time">{moment(noticeItem.time).fromNow()}</p>
        </div>
      </li>
    );
  }
}

NoticeItem.propTypes = propTypes;

export default NoticeItem;
