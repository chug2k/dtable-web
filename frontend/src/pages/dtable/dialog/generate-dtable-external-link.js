import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { Utils } from '../../../utils/utils';
import toaster from '../../../components/toast';
import Loading from '../../../components/loading';


const gettext = window.gettext;

const propTypes = {
  workspaceID: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  closeShareDialog: PropTypes.func.isRequired,
};

class GenerateDTableExternalLink extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      externalLink: '',
      isLoadingExternalLink: true,
      isConfirmDeleteShow: false
    };
  }

  componentDidMount() {
    let { workspaceID, name } = this.props;
    dtableWebAPI.getDTableExternalLink(workspaceID, name).then(res => {
      let externalLinks = res.data.links;
      if (externalLinks.length > 0) {
        this.setState({
          externalLink: externalLinks[0],
          isLoadingExternalLink: false
        });
      } else {
        this.setState({
          externalLink: null,
          isLoadingExternalLink: false,
        });
      }
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  generateExternalLink = () => {
    let { workspaceID, name } = this.props;
    dtableWebAPI.createDTableExternalLink(workspaceID, name).then(res => {
      let externalLink = res.data;
      this.setState({externalLink: externalLink});
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }
  
  deleteExternalLink = () => {
    let { workspaceID, name } = this.props;
    let { externalLink } = this.state;
    dtableWebAPI.deleteDTableExternalLink(workspaceID, name, externalLink.token).then(() => {
      this.setState({
        externalLink: null,
        isConfirmDeleteShow: false
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  onDeleteExternalLinkToggle = () => {
    this.setState({isConfirmDeleteShow: !this.state.isConfirmDeleteShow});
  }

  onCopyExternalLink = () => {
    let { externalLink } = this.state;
    copy(externalLink.url);
    toaster.success(gettext('External link is copied to the clipboard.'));
    this.props.closeShareDialog();
  }

  render() {

    let { externalLink, isLoadingExternalLink, isConfirmDeleteShow } = this.state;
    if (isLoadingExternalLink) {
      return <Loading />;
    }

    return (
      <div className="external-link-container">
        {!externalLink && (
          <Fragment>
            <p className="external-link-tip">{gettext('External link enables you to share a table to anonymous users in read-only mode.')}</p>
            <button className="btn btn-primary" onClick={this.generateExternalLink}>{gettext('Generate')}</button>
          </Fragment>
        )}
        {externalLink && (
          <Fragment>
            <div className="link-info">
              <span className="external-link">{externalLink.url}</span>
              <span className="dtable-font dtable-icon-copy-link action-icon" title={gettext('Copy')} onClick={this.onCopyExternalLink}></span>
            </div>
            {!isConfirmDeleteShow && (
              <button className="btn btn-primary mt-4" onClick={this.onDeleteExternalLinkToggle}>{gettext('Delete')}</button>
            )}
            {isConfirmDeleteShow && (
              <div className="alert alert-warning mt-4">
                <h4 className="alert-heading">{gettext('Are you sure you want to delete the external link?')}</h4>
                <p className="mb-4">{gettext('If the external link is deleted, no one will be able to access it any more.')}</p>
                <button className="btn btn-primary mr-4" onClick={this.deleteExternalLink}>{gettext('Delete')}</button> 
                <button className="btn btn-secondary" onClick={this.onDeleteExternalLinkToggle}>{gettext('Cancel')}</button>
              </div>
            )}
          </Fragment>
        )}
      </div>
    );
  }
}

GenerateDTableExternalLink.propTypes = propTypes;

export default GenerateDTableExternalLink;
