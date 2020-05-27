import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../utils/constants';
import { FormGroup, Input, Col } from 'reactstrap';
import { dtableWebAPI } from '../../utils/dtable-web-api';

const BIND_STATE = {
  BOUND_PHONE: 'bound_phone',
  UNBOUND_PHONE: 'unbound_phone',
  BINDING_PHONE: 'binding_phone',
};

const propTypes = {
  oldBindPhone: PropTypes.string,
};

class BindPhone extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      bindState: BIND_STATE.UNBOUND_PHONE,
      oldPhoneNumber: props.oldBindPhone,
      newPhoneNumber: props.oldBindPhone,
      phoneNumberMessage: '',
      isSendCodeError: false,
      inputVerifyCode: '',
      verifyCodeMessage: '',
      isVerifyCodeRequired: false,
      isSendCodeAvailable: false,
      intervalCount: 60,
    };

    this.timter = null;
  }

  componentDidMount() {
    let { oldBindPhone } = this.props;
    if (oldBindPhone) {
      this.setState({
        bindState: BIND_STATE.BOUND_PHONE
      });
    } else {
      let verifyCodeMessage = gettext('Send Verify Code');
      this.setState({
        bindState: BIND_STATE.UNBOUND_PHONE,
        verifyCodeMessage: verifyCodeMessage,
        isSendCodeAvailable: true,
      });
    }
  }

  onChangePhoneNumber = (event) => {
    let value = event.target.value.trim();
    this.setState({newPhoneNumber: value});
  }
  
  onChangeVerifyCode = (event) => {
    let value = event.target.value.trim();
    this.setState({inputVerifyCode: value});
  }

  validPhone = () => {
    let reg = /^1[345678]\d{9}$/g;
    return this.state.newPhoneNumber.match(reg) !== null;
  }

  validCode = () => {
    return this.state.verifyCode !== '';
  }

  setSendCodeTimer = () => {
    this.timer = setInterval(() => {
      let { intervalCount } = this.state;
      if (intervalCount) {
        let count = intervalCount - 1;
        let verifyCodeMessage = gettext('Resend after {count}s').replace('{count}', count);
        this.setState({
          intervalCount: count,
          verifyCodeMessage: verifyCodeMessage,
        });
      } else {
        clearInterval(this.timer);
        let verifyCodeMessage = gettext('Send Verify Code');
        this.setState({
          phoneNumberMessage: '',
          isSendCodeError: false,
          verifyCodeMessage: verifyCodeMessage,
          isSendCodeAvailable: true,
          intervalCount: 60,
        });
      }
    }, 1000);
  }

  onSendCode = () => {
    if(this.validPhone()) {
      const BIND_PHONE = 'bind_phone';
      dtableWebAPI.sendVerifyCode(this.state.newPhoneNumber, BIND_PHONE).then((res) => {
        let phoneNumberMessage = gettext('Verify code has been sent.');
        this.setState({
          bindState: BIND_STATE.BINDING_PHONE,
          phoneNumberMessage: phoneNumberMessage,
          isSendCodeError: false,
          isVerifyCodeRequired: true,
          isSendCodeAvailable: false,
        });
        this.setSendCodeTimer();
      }).catch((error) => {
        let message = '';
        if(error.response.status === 400) {
          message = gettext('Phone number is invalid.');
        } else if(error.response.status === 429) {
          message = gettext('Send code too often, please send later.');
        } else if(error.response.status === 500) {
          message =  gettext('Internal Server Error.');
        } else {
          message = gettext('Please check the network.');
        }
        this.setState({
          phoneNumberMessage: message,
          isSendCodeError: true,
        });
      });
    } else {
      let message = gettext('Phone number is invalid.');
      this.setState({
        phoneNumberMessage: message,
        isSendCodeError: true,
      });
    }
  }

  bindPhoneNumber = () => {
    if(this.validPhone() && this.validCode()) {
      let { newPhoneNumber, inputVerifyCode } = this.state;
      dtableWebAPI.bindPhoneNumber(newPhoneNumber, inputVerifyCode).then((res) => {
        let message = gettext('Phone number has been bound successfully.');
        if(this.timer) {
          clearInterval(this.timer);
        }
        // reset
        this.setState({
          bindState: BIND_STATE.BOUND_PHONE,
          phoneNumberMessage: message,
          isSendCodeError: false,
          inputVerifyCode: '',
          verifyCodeMessage: '',
          isVerifyCodeRequired: false,
          isSendCodeAvailable: false,
          intervalCount: 60,
        });
      }).catch((error) => {
        let message = '';
        if(error.response.status === 400) {
          message = gettext('Phone number is invalid.');
        } else if(error.response.status === 403) {
          message = gettext('Code is incorrect.');
        } else if(error.response.status === 500) {
          message = gettext('Internal Server Error.');
        } else {
          message = gettext('Please check the network.');
        }
        this.setState({
          phoneNumberMessage: message,
          isSendCodeError: true,
        });
      });
    } else {
      let message = gettext('Phone number or code is invalid.');
      this.setState({
        phoneNumberMessage: message,
        isSendCodeError: true,
      });
    }
  }

  updatePhoneNumber = () => {
    let verifyCodeMessage = gettext('Send Verify Code');
    this.setState({
      bindState: BIND_STATE.UNBOUND_PHONE,
      isSendCodeAvailable: true,
      verifyCodeMessage: verifyCodeMessage,
    });
  }

  render() {

    let { bindState, newPhoneNumber, phoneNumberMessage, isVerifyCodeRequired, isSendCodeAvailable, inputVerifyCode, verifyCodeMessage } = this.state;
    let canEdit = (bindState !== BIND_STATE.BOUND_PHONE);

    return (
      <div id="bind-phone" className="bind-phone-module setting-item">
        <h3 className="setting-item-heading">{gettext('Bind Phone Number')}</h3>
        <div className="bind-phone-container">
          <FormGroup row>
            <Col className="col-sm-9 row">
              <Input className="phone-number" value={newPhoneNumber} onChange={this.onChangePhoneNumber} readOnly={!canEdit} />
              {this.state.phoneNumberMessage && (
                <div className="col-sm-auto ml-1 bind-phone-message">
                  {this.state.isSendCodeError ? 
                    <i className="dtable-font dtable-icon-exclamation-circle error" /> :
                    <i className="dtable-font dtable-icon-check-circle success" />
                  }
                  <span className={`ml-1 ${this.state.isSendCodeError ? 'error': 'success'}`}>{phoneNumberMessage}</span>
                </div>
              )}
            </Col>
          </FormGroup>
          {this.state.bindState !== BIND_STATE.BOUND_PHONE && (
            <FormGroup row>
              <Col className="col-sm-9 row">
                {isVerifyCodeRequired ?
                  <div className="verify-code-container">
                    <Input className="verify-code" value={inputVerifyCode} onChange={this.onChangeVerifyCode}/>
                    <button className={`col-sm-auto btn btn-outline-${isSendCodeAvailable ? 'custom' : 'disabled' } ${isVerifyCodeRequired ? 'ml-1' : ''}`} onClick={this.onSendCode} disabled={!isSendCodeAvailable}>{verifyCodeMessage}</button>
                  </div>
                  :
                  <button className={`btn btn-outline-${isSendCodeAvailable ? 'primary' : 'disabled' } ${isVerifyCodeRequired ? 'ml-1' : ''}`} onClick={this.onSendCode} disabled={!isSendCodeAvailable}>{verifyCodeMessage}</button>
                }
              </Col>
            </FormGroup>
          )}
          
          {(this.state.bindState === BIND_STATE.BINDING_PHONE && isVerifyCodeRequired) && (
            <FormGroup className="row">
              <button className={`btn btn-outline-${inputVerifyCode ? 'primary' : 'disabled'}`} onClick={this.bindPhoneNumber} disabled={!inputVerifyCode}>{gettext('Bind Phone Number')}</button>
            </FormGroup>
          )}
          {this.state.bindState === BIND_STATE.BOUND_PHONE && (
            <FormGroup className="row">
              <button className="btn btn-outline-primary" onClick={this.updatePhoneNumber}>{gettext('Update Phone Number')}</button>
            </FormGroup>
          )}
        </div>
      </div>
    );
  }
}

BindPhone.propTypes = propTypes;

export default BindPhone;