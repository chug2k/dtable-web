import React from 'react';
import PropTypes from 'prop-types';
import { CELL_ICON } from '../../dtable-share-row/contants/contants';

const propTypes = {
  columnSetting: PropTypes.object.isRequired,
  onColumnItemClick: PropTypes.func.isRequired,
};

class FormSettingItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isChecked: props.columnSetting.flag
    };
  }

  onColumnItemClick = (event) => {
    event.nativeEvent.stopImmediatePropagation();
    let value = event.target.checked;
    if (value === this.state.isChecked) {
      return;
    }
    let { columnSetting } = this.props;
    this.setState({isChecked: value}, () => {
      this.props.onColumnItemClick(columnSetting.key, !columnSetting.flag); 
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.columnSetting.flag !== this.props.columnSetting.flag) {
      this.setState({isChecked: nextProps.columnSetting.flag});
    }
  }
 
  render() {
    let { columnSetting } = this.props;
    let iconClass = CELL_ICON[columnSetting.type];
    return (
      <div className="form-setting-item">
        <div className="form-column-switch">
          <label className="custom-switch">
            <input className="custom-switch-input" type="checkbox" checked={this.state.isChecked} onChange={this.onColumnItemClick} name="custom-switch-checkbox" />
            <span className="custom-switch-description text-truncate"><i className={`dtable-font ${iconClass}`}></i><span>{columnSetting.name}</span></span>
            <span className="custom-switch-indicator"></span>
          </label>
        </div>
      </div>
    );
  }
}

FormSettingItem.propTypes = propTypes;

export default FormSettingItem;
