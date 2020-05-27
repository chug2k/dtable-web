import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Utils } from '../../utils/utils';
import Loading from '../../components/loading';
import { gettext } from '../../utils/constants';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import EmptyTip from '../../components/empty-tip';

import './css/forms.css';


const listFormItemPropTypes = {
  formItem: PropTypes.object.isRequired,
};

class ListFormItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isActive: false,
    };
  }

  onMouseEnter = () => {
    this.setState({ isActive: true });
  }

  onMouseLeave = () => {
    this.setState({ isActive: false });
  }

  render() {
    let { formItem } = this.props;
    let formConfig = JSON.parse(formItem.form_config);
    let formName = formConfig.form_name;
    let itemLink = formItem.form_link;
    let groupName = formItem.group_name;
    return (
      <tr onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <td className="text-center"><i className="dtable-font dtable-icon-form dtable-icon-style"></i></td>
        <td>
          <div className="form-item-content">
            <a className="form-item-text" href={itemLink} target="_blank" rel='noreferrer noopener'>{formName}</a>
          </div>
        </td>
        <td>
          <div className="form-item-group-name">{groupName}</div>
        </td>
      </tr>
    );
  }
}

ListFormItem.propTypes = listFormItemPropTypes;


class MainPanelForms extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isFormLoading: true,
      sharedList: [],
      errorMsg: '',
    };
  }

  componentDidMount() {
    dtableWebAPI.listSharedForms().then(res => {
      this.setState({
        isFormLoading: false,
        sharedList: res.data.shared_list,
      });
    }).catch((error) => {
      let errMessage = Utils.getErrorMsg(error);
      this.setState({ errorMsg: errMessage, isFormLoading: false });
    });
  }

  render() {
    let { isFormLoading, sharedList } = this.state;
    if (isFormLoading) return <Loading />;
    
    if (sharedList.length === 0) {
      return (
        <div className="main-panel-center">
          <div className="cur-view-container">
            <div className="cur-view-content">
              <EmptyTip>
                <Fragment>
                  <h2>{gettext('No forms are shared to you yet.')}</h2>
                  <p>{gettext('Forms shared to your groups will be shown here.')}</p>
                </Fragment>
              </EmptyTip>
            </div>
          </div>
        </div>
      );
    }
    let isDesktop = Utils.isDesktop();

    return (
      <div className="main-panel-center">
        <div className="cur-view-container" id="forms">
          <div className="cur-view-content d-block" onScroll={this.handleScroll}>
            <div className="forms-title">{gettext('Shared Forms')}</div>
            {this.state.errorMsg &&
              <p className="error text-center">{this.state.errorMsg}</p>
            }
            {!this.state.errorMsg &&
              <table className="table-hover activity-table">
                <thead>
                  <tr>
                    <th width={isDesktop ? '5%' : '10%'}></th>
                    <th width={isDesktop ? '70%' : '65%'}>{gettext('Name')}</th>
                    <th width={isDesktop ? '25%' : '25%'}>{gettext('Group')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedList.map((formItem, index) => {
                    return (
                      <ListFormItem
                        key={index}
                        formItem={formItem}
                      />);
                  })}
                </tbody>
              </table>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default MainPanelForms;
