import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../utils/constants';
import { Utils } from '../../utils/utils';
import {Button, Modal, ModalHeader, Input, ModalBody, ModalFooter, Alert, Label, Form, FormGroup} from 'reactstrap';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import toaster from '../toast';

const propTypes = {
  dtable: PropTypes.object.isRequired,
  toggleCancel: PropTypes.func.isRequired,
};

class SeafileConnectorDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      seafileURL: '',
      seafileURLPlaceholder: gettext('Please enter Seafile server\'s URL'),
      repoAPIToken: '',
      repoAPITokenPlaceholder: gettext('Please enter library\'s API Token'),

      isButtonActive: false,
      stage: 0,  // 0: need to check; 1: need to submit

      connectors: [],
      errMessage: '',
      repoInfo: null,
      frontTestValid: false,
    };
  }

  componentDidMount() {
    this.getSeafileConnectors();
  }

  getSeafileConnectors = () => {
    dtableWebAPI.getSeafileConnectors(this.props.dtable.id).then(res => {
      let connectors = res.data.seafile_connectors;
      if(connectors.length > 0) {
        this.setState({
          connectors: connectors,
          isButtonActive: false,
          seafileURL: connectors[0].seafile_url,
          repoAPIToken: connectors[0].repo_api_token,
        });
      }
    }).catch((error) => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
    });
  }

  createSeafileConnector = () => {
    let dtableId = this.props.dtable.id;
    let seafileURL = this.state.seafileURL;
    let repoAPIToken = this.state.repoAPIToken;
    dtableWebAPI.createSeafileConnector(dtableId, seafileURL, repoAPIToken).then(res => {
      let connectors = this.state.connectors;
      connectors.push(res.data);
      this.setState({
        connectors: connectors,
        isButtonActive: false,
      });
      let msg = gettext('Successfully connect library {repo_name}').replace('{repo_name}', this.state.repoInfo.repo_name);
      toaster.success(msg);
      this.toggle();
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
      this.setState({
        isButtonActive: true,
      });
    });
  }

  updateSeafileConnector = () => {
    let dtableId = this.props.dtable.id;
    let seafileURL = this.state.seafileURL;
    let repoAPIToken = this.state.repoAPIToken;
    let connectors = this.state.connectors;
    dtableWebAPI.updateSeafileConnector(dtableId, seafileURL, repoAPIToken, connectors[0].id).then(res => {
      let connectors = [res.data];
      this.setState({
        connectors: connectors,
        isButtonActive: false,
      });
      let msg = gettext('Successfully connect library {repo_name}').replace('{repo_name}', this.state.repoInfo.repo_name);
      toaster.success(msg);
      this.toggle();
    }).catch(error => {
      let errMsg = Utils.getErrorMsg(error, true);
      if (!error.response || error.response.status !== 403) {
        toaster.danger(errMsg);
      }
      this.setState({
        isButtonActive: true,
      });
    });
  }

  testInputURLAndToken = () => {
    let { seafileURL, repoAPIToken } = this.state;
    seafileURL = seafileURL.replace(/\/+$/, '');
    let url = seafileURL + '/api/v2.1/via-repo-token/repo-info/';
    fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Authorization': 'token '+ repoAPIToken,
      },
    }).then((response) => {
      return response.json();
    }).then((data) => {
      let {repo_name, repo_id} = data;
      if(repo_id && repo_name) {
        this.setState({
          repoInfo: data,
          frontTestValid: true,
          stage: 1,
        });
      }
    }).catch((e)=> {
      this.setState({
        frontTestValid: false,
        stage: 0,
        errMessage: gettext('Seafile server\'s URL or library\'s API Token is invalid'),
      });
    });
  }

  handleCheck = () => {
    let { isValid, errMessage } = this.validateInput();
    if(!isValid) {
      this.setState({errMessage: errMessage});
    } else {
      this.setState({errMessage: ''});
      this.testInputURLAndToken();
    }
  }

  handleSubmit = () => {
    let { isValid, errMessage } = this.validateInput();
    if(!isValid) {
      this.setState({errMessage: errMessage});
    } else {
      this.setState({errMessage: ''});
      if(this.state.connectors.length === 0) {
        this.createSeafileConnector();
      } else {
        this.updateSeafileConnector();
      }
    }
  }

  handleClick = () => {
    return this.state.stage === 0 ? this.handleCheck : this.handleSubmit;
  }

  getButtonText = () => {
    return this.state.stage === 0 ? gettext('Check') : gettext('Submit');
  }

  getButtonActive = () => {
    let { stage, connectors, seafileURL, repoAPIToken} = this.state;
    if(stage === 0 && connectors.length > 0 ) {
      if(seafileURL === connectors[0].seafile_url && repoAPIToken === connectors[0].repo_api_token) {
        return false;
      }
    }
    return true;
  }

  toggle = () => {
    this.props.toggleCancel(this.props.dtable);
  }

  handleURLChange = (e) => {
    if (!e.target.value.trim()) {
      this.setState({isSubmitBtnActive: false});
    } else {
      this.setState({isSubmitBtnActive: true});
    }
    let end = e.target.value.replace(/\/+$/, '');
    if(this.state.stage === 1 && end !== this.state.seafileURL) {
      this.setState({stage: 0, repoInfo: null});
    }
    this.setState({seafileURL: e.target.value});
  }

  handleTokenChange = (e) => {
    if (!e.target.value.trim()) {
      this.setState({isSubmitBtnActive: false});
    } else {
      this.setState({isSubmitBtnActive: true});
    }
    if(this.state.stage === 1 && e.target.value !== this.state.repoAPIToken) {
      this.setState({stage: 0, repoInfo: null});
    }
    this.setState({repoAPIToken: e.target.value});
  }

  validateInput = () => {
    this.setState({ seafileURL: this.state.seafileURL.replace(/\/+$/, '') });
    let { seafileURL, repoAPIToken } = this.state;
    let isValid = true;
    let errMessage = '';
    if (seafileURL.indexOf('http') !== 0) {
      isValid = false;
      errMessage = gettext('Seafile server\'s URL is invalid.');
      return { isValid, errMessage };
    }
    if (repoAPIToken.length !== 40) {
      isValid = false;
      errMessage = gettext('Library\'s API Token is invalid.');
      return { isValid, errMessage };
    }
    return { isValid, errMessage };
  }

  render() {
    return (
      <Modal isOpen={true} toggle={this.toggle}>
        <ModalHeader>{gettext('Connect Seafile')}</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label>{gettext('URL')}</Label>
              <Input
                value={this.state.seafileURL}
                onChange={this.handleURLChange}
                placeholder={this.state.seafileURLPlaceholder}
              />
            </FormGroup>
            <FormGroup>
              <Label>{gettext('API Token')}</Label>
              <Input
                value={this.state.repoAPIToken}
                onChange={this.handleTokenChange}
                placeholder={this.state.repoAPITokenPlaceholder}
              />
              {this.state.errMessage && <Alert color="danger" className="mt-2">{this.state.errMessage}</Alert>}
              {!this.state.errMessage && this.state.repoInfo && <Alert color="success" className="mt-2">{this.state.repoInfo.repo_name}</Alert>}
            </FormGroup>
          </Form>

        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>{gettext('Cancel')}</Button>
          <Button
            color="primary"
            onClick={this.state.stage === 0 ? this.handleCheck : this.handleSubmit}
            disabled={!this.getButtonActive()}
          >
            {this.getButtonText()}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

SeafileConnectorDialog.propTypes = propTypes;

export default SeafileConnectorDialog;
