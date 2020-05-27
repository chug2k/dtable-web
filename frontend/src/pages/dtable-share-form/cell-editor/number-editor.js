import React from 'react';
import PropTypes from 'prop-types';
import isHotkey from 'is-hotkey';
import { getFloatNumber, getCurrentOption } from '../utils/number-utils';

const propTypes = {
  isReadOnly: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  column: PropTypes.object,
  onCommit: PropTypes.func,
};

class NumebrEditor extends React.Component {

  static defaultProps = {
    isReadOnly: false,
    value: '',
  }

  constructor(props) {
    super(props);
    this.state = {
      isDateInit: false,
      inputValue: '',
      textValue: '',
      isEditorShow: false,
    };
  }

  componentDidMount() {
    let value = this.props.value;
    let newValue = !value && value !== 0 ? '' : value;
    let dateFormat = this.getDateFormat();
    newValue = getCurrentOption(newValue, dateFormat);
    this.setState({
      inputValue: newValue,
      textValue: newValue,
    });
  }

  formatValue = (value) => {
    let format = this.getDateFormat();
    switch(format) {
      case 'number':
      case 'number-with-commas': {
        return value.replace(/[^.-\d,]/g,'');
      }
      case 'percent': {
        return value.replace(/[^.-\d,%]/g, '');
      }
      case 'yuan': {
        return value.replace(/[^.-\d￥,]/g, '');
      }
      case 'dollar': {
        return value.replace(/[^.-\d$,]/g, '');
      }
      case 'euro': {
        return value.replace(/[^.-\d€,]/g, '');
      }
      default:
        return value.replace(/[^.-\d,]/g,'');
    }
  }

  getDateFormat = () => {
    let { column } = this.props;
    let dataFormat = column.data && column.data.format;
    let defaultFormat = 'number';
    return dataFormat || defaultFormat;
  }

  onCommit = () => {
    let updated = {};
    let { column } = this.props;
    let inputValue = this.state.inputValue ? this.state.inputValue.toString() : '';
    let value = getFloatNumber(inputValue);
    updated[column.key] = value;
    this.props.onCommit(updated);

    let dateFormat = this.getDateFormat();
    let newValue = getCurrentOption(value, dateFormat);
    this.setState({
      isEditorShow: false,
      textValue: newValue
    });
  }

  onEditorHandle = () => {
    if (this.props.isReadOnly) {
      return;
    }
    this.setState({
      isEditorShow: true,
      inputValue: this.state.textValue
    }, () => {
      this.input.focus();
    });
  }

  onBlur = () => {
    this.onCommit();
  }

  onChange = (event) => {
    let value = event.target.value.trim();
    value = this.formatValue(value);
    if (value === this.state.inputValue) {
      return;
    }
    this.setState({inputValue : value});
  }

  onKeyDown = (event) => {
    let { selectionStart, selectionEnd, value } = event.currentTarget;
    if (isHotkey('enter', event)) {
      event.preventDefault();
      this.onBlur();
    } else if ((event.keyCode === 37 && selectionStart === 0) || 
      (event.keyCode === 39 && selectionEnd === value.length)
    ) {
      event.stopPropagation();
    }
  }

  onPaste = (e) => {
    e.stopPropagation();
  }

  onCut = (e) => {
    e.stopPropagation();
  }

  getStyle = () => {
    return {
      width: '320px',
      textAlign: 'left',
    };
  }

  setInputRef = (input) => {
    this.input = input;
    return this.input;
  };
  
  render() {
    let style = this.getStyle();
    return (
      <div className="cell-editor grid-cell-type-number">
        <div className="number-editor-container">
          {!this.state.isEditorShow &&
            <div className="form-control" style={style} onClick={this.onEditorHandle}>{this.state.textValue}</div>
          }
          {this.state.isEditorShow && (
            <input 
              ref={this.setInputRef}
              type="text"
              className="form-control"
              value={this.state.inputValue}
              onChange={this.onChange}
              onBlur={this.onBlur}
              onCut={this.onCut}
              onPaste={this.onPaste}
              style={style}
              onKeyDown={this.onKeyDown}
            />
          )}
        </div>
      </div>
    );
  }

}

NumebrEditor.propTypes = propTypes;

export default NumebrEditor;