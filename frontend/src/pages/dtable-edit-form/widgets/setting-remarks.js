import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'reactstrap';

const propTypes = {
  onRemarkChange: PropTypes.func.isRequired,
  onChangeRemarkShow: PropTypes.func.isRequired,
  onSubmitForm: PropTypes.func.isRequired,
  remarkOption: PropTypes.object,
};

const gettext = window.gettext;

class SettingRemarks extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isChecked: props.remarkOption ? props.remarkOption.isRemarkContentShow : true,
      textValue: props.remarkOption ? props.remarkOption.remarkContent : '',
    };
  }

  componentDidMount() {
    let { isChecked } = this.state;
    this.props.onChangeRemarkShow(isChecked);
  }

  onColumnItemClick = (event) => {
    event.nativeEvent.stopImmediatePropagation();
    let value = event.target.checked;
    if (value === this.state.isChecked) {
      return;
    }
    if (!value) {
      this.setState({textValue: null});
    }
    this.props.onChangeRemarkShow(value);
    this.setState({isChecked: value}, () => {
      this.props.onSubmitForm();
    });
  }

  handleChange = (e) => {
    const value = e.target.value;
    this.props.onRemarkChange(value);
    this.setState({textValue: value});
  }

  onBlur = () => {
    this.props.onSubmitForm();
  }

  render() {
    const { isChecked, textValue } = this.state;
    return (
      <div className="table-setting">
        <div className="form-setting-item">
          <div className="form-column-switch form-setting-remarks">
            <label className="custom-switch">
              <input 
                className="custom-switch-input" 
                type="checkbox" 
                checked={this.state.isChecked} 
                onChange={this.onColumnItemClick} 
                name="custom-switch-checkbox" 
              />
              <span className="form-setting-title">{gettext('Form Note')}</span>
              <span className="custom-switch-indicator"></span>
            </label>
          </div>
        </div>
        {isChecked && 
          <div className="form-remark-tip">
            <Input
              type="textarea"
              value={textValue || ''}
              onChange={this.handleChange}
              placeholder={gettext('Add notes here to guilde users how to fill the form.')}
              className="remark-tip-content"
              onBlur={this.onBlur}
            />
          </div>
        }
      </div>
    );
  }
}

SettingRemarks.propTypes = propTypes;

export default SettingRemarks;