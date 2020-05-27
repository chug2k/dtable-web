import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { Utils } from '../../utils/utils';
import { gettext } from '../../utils/constants';

const propTypes = {
  isTextMode: PropTypes.bool.isRequired,
  isEditIconShow: PropTypes.bool.isRequired,
  currentPermission: PropTypes.string.isRequired,
  onPermissionChanged: PropTypes.func.isRequired,
};

class DtableSharePermissionEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
    };
    this.options = this.getOption();
  }

  componentDidMount() {
    document.addEventListener('click', this.onHideSelect);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onHideSelect);
  }

  getOption = () => {
    const permissions = ['rw', 'r'];
    return permissions.map(permission => {
      let label = <div>{this.translatePermission(permission)}<div className="permission-editor-explanation">{this.translateExplanation(permission)}</div></div>;
      return { value: permission, label };
    });
  }

  translatePermission = (permission) => {
    return Utils.sharePerms(permission);
  }

  translateExplanation = (explanation) => {
    return Utils.dtableSharePermsExplanation(explanation);
  }

  onHideSelect = () => {
    this.setState({ isEditing: false });
  }

  onEditPermission = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    this.setState({ isEditing: true });
  }

  onPermissionChanged = (e) => {
    if (e.value !== this.props.currentPermission) {
      this.props.onPermissionChanged(e.value);
    }
    this.setState({ isEditing: false });
  }

  onSelectHandler = (e) => {
    e.nativeEvent.stopImmediatePropagation();
  }

  render() {
    const { currentPermission, isTextMode } = this.props;
    let optionTranslation = this.translatePermission(currentPermission);
    return (
      <div onClick={this.onSelectHandler} className="permission-editor">
        {(isTextMode && !this.state.isEditing) ?
          <Fragment>
            <span>{optionTranslation}</span>
            {this.props.isEditIconShow &&
              <span title={gettext('Edit')} className="dtable-font dtable-icon-rename attr-action-icon" onClick={this.onEditPermission}></span>
            }
          </Fragment>
          :
          <Select
            className="permission-editor-select"
            classNamePrefix="permission-editor"
            options={this.options}
            placeholder={optionTranslation}
            onChange={this.onPermissionChanged}
            captureMenuScroll={false}
          />
        }
      </div>
    );
  }
}

DtableSharePermissionEditor.propTypes = propTypes;

export default DtableSharePermissionEditor;
