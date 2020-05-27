import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../../utils/constants';

const propTypes = {
  popoverStyle: PropTypes.object.isRequired,
  options: PropTypes.array.isRequired,
  onAddNewOption: PropTypes.func,
  selectedOptions: PropTypes.array.isRequired,
  onOptionItemToggle: PropTypes.func.isRequired,
};

class SelectEditorPopover extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      searchValue: '',
      isShowCreateBtn: false,
    };
  }

  onValueChanged = (event) => {
    let value = event.target.value.trim();
    this.setState({searchValue: value});
  }

  onInputClick = (event) => {
    event.nativeEvent.stopImmediatePropagation();
    event.stopPropagation();
  } 

  onAddNewOption = () => {
    let name = this.state.searchValue;
    this.props.onAddNewOption(name);
  }

  onOptionItemToggle = (item) => {
    this.props.onOptionItemToggle(item);
  }

  getFilterOptions = () => {
    let { options } = this.props;
    let filter = this.state.searchValue.toLowerCase();
    if (!filter) {
      return options;
    }
    return options.filter(option => {
      return (option.name.toString().toLowerCase()).indexOf(filter) > -1;
    });
  }

  getOptionStyle = (option) => {
    const textColor = option.textColor || null;
    return {
      display: 'inline-block',
      padding: '0px 10px',
      height: '20px',
      lineHeight: '20px',
      borderRadius: '10px',
      fontSize: '13px',
      backgroundColor: option.color,
      color: textColor,
    };
  }

  render() {
    let { popoverStyle, selectedOptions } = this.props;
    let options = this.getFilterOptions();
    let { isShowCreateBtn } = this.state;
    return (
      <div className="select-editor-popover" style={popoverStyle}>
        <div className="select-options-search">
          <input className="form-control" onChange={this.onValueChanged} onClick={this.onInputClick} placeholder={gettext('Find a collaborator')}></input>
        </div>
        <div className="select-options-container">
          {options.length > 0 && options.map((option, index) => {
            let optionStyle = this.getOptionStyle(option);
            let isSelect = selectedOptions.some(selectedOption => {
              return selectedOption.id === option.id;
            }); 
            return (
              <div key={index} className="select-option-item" onClick={this.onOptionItemToggle.bind(this, option)}>
                <div className="option-info">
                  <div className="option-name" style={optionStyle}>{option.name}</div>
                </div>
                <div className="option-checked">
                  {isSelect && <i className="dtable-font dtable-icon-check-mark"></i>}
                </div>
              </div>
            );
          })}
          {options.length === 0 && (<div className="search-option-null">{gettext('No options avaliable')}</div>)}
        </div>
        {isShowCreateBtn && (
          <div className="select-options-add" onClick="this.onAddNewOption">{gettext('Add an option')}{this.state.searchValue}</div>
        )}
      </div>
    );
  }
}

SelectEditorPopover.propTypes = propTypes;

export default SelectEditorPopover;
