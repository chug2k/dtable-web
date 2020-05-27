import React from 'react';
import PropTypes from 'prop-types';
import * as zIndexes from '../utils/zIndexes';
import { gettext } from '../../../utils/constants';
import MobileCommonHeader from './mobile-common-header';

const propTypes = {
  closeEditor: PropTypes.func,
  onCommit: PropTypes.func,
  column: PropTypes.object,
  value: PropTypes.string,
  isReadOnly: PropTypes.bool,
};

class SingleSelectView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      value: props.value || '',
      searchVal: '',
      options: props.column.data ? props.column.data.options : [],
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
    searchVal = event.target.value;
    this.setState({ searchVal });
  }

  getFilteredOptions = () => {
    let { searchVal, options } = this.state;
    return searchVal ? options.filter((item) => item.name.indexOf(searchVal) > -1) : options;
  }

  onRemoveOption = () => {
    this.setState({ value: '' }, () => {
      this.props.onCommit({id: this.state.value});
      this.props.closeEditor();
    });
  }

  onSelectOption = (optionID) => {
    this.setState({ value: optionID }, () => {
      this.props.onCommit({id: this.state.value});
      this.props.closeEditor();
    });
  }

  renderMenuContent = (options) => {
    let { value } = this.state;
    if (options.length === 0) {
      return <div className="none-search-result">{gettext('No options available.')}</div>;
    }
    // this.clientWidth - 16 - 10 - 20 - 10: 
    // clientWidth - select-options-body's paddingLeft - single-select-container's paddingRight - check-icon's width - gaps
    return options.map((option, i) => {
      return (
        <div className="single-select-item" key={i}>
          <div className="single-select-container" onMouseDown={this.onSelectOption.bind(this, option.id)}>
            <span className="single-select">
              <span className="single-select-name" 
                style={{backgroundColor: option.color, color: option.textColor || null, maxWidth: this.clientWidth - 16 - 10 - 20 - 10}}
              >
                {option.name}
              </span>
            </span>
            {value === option.id && 
              <span className='single-select-check-icon'><i className="dtable-font dtable-icon-check-mark"></i></span>
            }
          </div>
        </div>
      );
    });
  }

  render() {
    const { column, value, isReadOnly } = this.props;
    const { searchVal } = this.state;
    const filteredOptions = this.getFilteredOptions();
    const isShowCreateBtn = searchVal ? filteredOptions.findIndex(option => option.name === searchVal) === -1 : false;
    let selectedOption = column.data && column.data.options.find(option => option.id === value);
    let textColor = selectedOption ? selectedOption.textColor : null;
    return (
      <div className="row-expand-view single-select-view" style={{ zIndex: zIndexes.ROW_EXPAND_VIEW }}>
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
            <div className="current-cell-value">
              {selectedOption ?
                <div className="current-option-container" style={{ backgroundColor: selectedOption.color }}>
                  <span className="current-option-name" style={{ color: textColor}}>{selectedOption.name}</span>
                  {!isReadOnly && 
                    <div className="remove-container" onClick={this.onRemoveOption}>
                      <i className="remove-option dtable-font dtable-icon-fork-number" style={{ color: textColor === '#FFFFFF' ? textColor : null }}></i>
                    </div>
                  }
                </div>
                :
                <span className="empty-placeholder">{gettext('No option')}</span>
              }
            </div>
          </div>
          <div className="view-partition"></div>
          <div className="single-selects-editor-list">
            <div className="search-single-selects">
              <input
                className="form-control"
                type="text"
                placeholder={gettext('Find an option')}
                value={searchVal}
                onChange={this.onChangeSearch}
                onClick={(e) => {e.stopPropagation();}}
              />
            </div>
            <div className="view-subtitle">
              <span>{!isShowCreateBtn && gettext('Choose an option')}</span>
            </div>
            <div className="single-selects-container">
              {this.renderMenuContent(filteredOptions)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SingleSelectView.propTypes = propTypes;

export default SingleSelectView;