import React from 'react';
import PropTypes from 'prop-types';
import * as zIndexes from '../utils/zIndexes';
import { gettext } from '../../../utils/constants';
import MobileCommonHeader from './mobile-common-header';

const propTypes = {
  column: PropTypes.object,
  value: PropTypes.array,
  onCommit: PropTypes.func,
  closeEditor: PropTypes.func,
  isReadOnly: PropTypes.bool,
};

class MultipSelectView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      value: props.value || [],
      searchVal: '',
      options: (props.column && props.column.data) ? props.column.data.options : [],
    };
    this.clientHeight = document.body.clientHeight;
    this.clientWidth = document.body.clientWidth;
  }

  componentDidMount() {
    history.pushState(null, null, '#');
    window.addEventListener('popstate', this.handleHistaryBack, false); 
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handleHistaryBack, false);
  }

  handleHistaryBack = (e) => {
    e.preventDefault();
    this.props.closeEditor();
  }

  onChangeSearch = (event) => {
    let { searchVal } = this.state;
    if (searchVal === event.target.value) {
      return;
    }
    this.setState({ searchVal: event.target.value });
  }

  onSelectOption = (optionID) => {
    let { value } = this.state;
    let optionIdx = value.indexOf(optionID);
    let updatedValue = value.slice(0);
    if (optionIdx > -1) {
      updatedValue.splice(optionIdx, 1);
    } else {
      updatedValue.push(optionID);
    }
    this.setState({ value: updatedValue }, () => {
      this.props.onCommit(this.state.value);
    });
  }

  getFilteredOptions = () => {
    let { searchVal, options } = this.state;
    if (searchVal) {
      return options.filter((item) => item.name.indexOf(searchVal) > -1);
    } else {
      return options;
    } 
  }

  onRemoveOption = (optionIdx) => {
    let { value } = this.state;
    let updatedValue = value.slice(0);
    updatedValue.splice(optionIdx, 1);
    this.setState({ value: updatedValue }, () => {
      this.props.onCommit(this.state.value);
    });
  }

  getMultipleSelectList = () => {
    const { value } = this.state;
    const { column, isReadOnly } = this.props;
    const options = column.data ? column.data.options : [];
    let newValue = [];
    if (Array.isArray(value)) { 
      value.forEach((v, optionIdx) => {
        let option = options.find(option => option.id === v);
        if (option) {
          newValue.push(
            <div className="multiple-select-item current-multiple-select-item" key={'multiple_select_' + optionIdx}>
              <div className="current-option-container" style={{ backgroundColor: option.color }} title={option.name}>
                <span className="current-option-name" style={{ color: option.textColor || null }}>{option.name}</span>
                {!isReadOnly && 
                  <div className="remove-container" onClick={this.onRemoveOption.bind(this, optionIdx)}>
                    <i className="remove-option dtable-font dtable-icon-fork-number" style={{ color: option.textColor === '#FFFFFF' ? option.textColor : null }}></i>
                  </div>
                }
              </div>
            </div>
          );
        }
      });
    }
    return newValue;
  }

  renderMenuContent = (filteredOptions) => {
    let { value } = this.state;
    if (filteredOptions.length === 0) {
      return (<span className="none-search-result">{gettext('No options available.')}</span>);
    }
    // this.clientWidth - 16 - 10 - 20 - 10: 
    // clientWidth - select-options-body's paddingLeft - single-select-container's paddingRight - check-icon's width - gaps
    return filteredOptions.map((option, i) => {
      const isSelected = value.find((item) => item === option.id);
      return (
        <div key={i} className="dropdown-item multiple-select-item">
          <div className="multiple-select-container" onMouseDown={this.onSelectOption.bind(this, option.id)}>
            <div className="multiple-select">
              <span className="multiple-select-name" 
                style={{backgroundColor: option.color, color: option.textColor || null, maxWidth: this.clientWidth - 16 - 10 - 20 - 10}}
              >
                {option.name}
              </span>
            </div>
            <div className='multiple-select-check-icon'>
              {isSelected && <i className="dtable-font dtable-icon-check-mark"></i>}
            </div>
          </div>
        </div>
      );
    });
  }

  render() {
    let { column } = this.props;
    let { searchVal } = this.state;
    let filteredOptions = this.getFilteredOptions();
    let isShowCreateBtn = false;
    if (this.state.searchVal) {
      isShowCreateBtn = filteredOptions.findIndex(option => option.name === searchVal) === -1 ? true : false;
    }
    let value = this.getMultipleSelectList();
    return (
      <div className="row-expand-view multiple-select-view" style={{ zIndex: zIndexes.ROW_EXPAND_VIEW }}>
        <MobileCommonHeader
          title={column.name}
          onLeftClick={this.props.closeEditor}
          leftName={(<i className="dtable-font dtable-icon-return"></i>)}
        />
        <div className="select-options-body" style={{ maxHeight: this.clientHeight - 50 }}>
          <div className="current-cell-value-container">
            <div className="view-subtitle">
              <span>{gettext('Current option')}</span>
            </div>
            <div className="current-cell-value" style={value.length  === 0 ? {height: 50} : {}}>
              {value.length > 0 ?
                value
                :
                <span className="empty-placeholder">{gettext('No option')}</span>
              }
            </div>
          </div>
          <div className="view-partition"></div>
          <div className="multiple-selects-editor-list">
            <div className="search-multiple-selects">
              <input
                className="form-control"
                type="text"
                placeholder={gettext('Find an option')}
                value={this.state.searchVal}
                onChange={this.onChangeSearch}
                onClick={(e) => {e.stopPropagation();}}
              />
            </div>
            <div className="view-subtitle">
              <span>{!isShowCreateBtn && gettext('Choose options')}</span>
            </div>
            <div className="multiple-selects-container">
              {this.renderMenuContent(filteredOptions)}
            </div> 
          </div>
        </div>
      </div>
    );
  }
}

MultipSelectView.propTypes = propTypes;

export default MultipSelectView;
