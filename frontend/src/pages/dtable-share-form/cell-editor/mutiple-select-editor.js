import React from 'react';
import PropTypes from 'prop-types';
import SelectEditorOption from '../cell-editor-widgets/select-editor-option';
import SelectEditorPopover from '../cell-editor-widgets/select-editor-popover';
import MediaQuery from 'react-responsive';
import MultipSelectView from '../cell-viewer-mobile/multi-select-view';
import { gettext } from '../../../utils/constants';

import '../css/select-editor.css';

const propTypes = {
  isReadOnly: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  column: PropTypes.object,
  onCommit: PropTypes.func,
};

const POPOVER_MAX_HEIGHT = 200;

class MutipleSelectEditor extends React.Component {

  static defaultProps = {
    isReadOnly: false,
    value: []
  }

  constructor(props) {
    super(props);
    this.state = {
      newValue: null,
      isPopoverShow: false
    };

    this.isEditorMounted = false;
  }

  componentDidMount() {
    let value = this.props.value;
    this.isEditorMounted = true;
    this.setState({newValue: value});
    document.addEventListener('click', this.onDocumentToggle);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onDocumentToggle);
  }

  onDocumentToggle = (e) => {
    if (this.MobileMask && this.MobileMask.contains(e.target)) {
      return;
    }
    this.setState({isPopoverShow: false});
  }

  onAddOptionToggle = (event) => {
    if (event) {
      event.nativeEvent.stopImmediatePropagation();
      event.stopPropagation();
    }
    if (this.props.isReadOnly) {
      return;
    }
    this.setState({isPopoverShow: !this.state.isPopoverShow});
  }

  onCommit = (newValue) => {
    let updated = {};
    let { column } = this.props;
    updated[column.key] = newValue;
    this.props.onCommit(updated, column);
  }

  onDeleteSelectOption = (option) => {
    let { newValue : currentValue } = this.state;
    let newValue = currentValue.filter(item => item !== option.id);
    this.setState({newValue: newValue}, () => {
      this.onCommit(newValue);
    });
  }

  onAddNewOption = (name) => {
    // need todo
  }

  onOptionItemToggle = (option) => {
    let { newValue } = this.state;

    let option_index = newValue.indexOf(option.id);
    if (option_index > -1) {
      newValue.splice(option_index, 1);
    } else {
      newValue.push(option.id);
    }

    this.setState({newValue: newValue}, () => {
      this.onCommit(newValue);
    });

  }

  formatOptions = () => {
    let { newValue } = this.state;
    let { column } = this.props;
    let options = (column && column.data && column.data.options) || [];

    if (!newValue || !newValue.length === 0) {
      return [];
    } 

    let selectedOptions = options.filter(option => {
      return newValue.indexOf(option.id) > -1;
    });

    return selectedOptions;
  }

  setEditorRef = (editor) => {
    this.editor = editor;
  }

  caculatePopoverPosition = () => {
    let innerHeight = window.innerHeight;
    let { top, left, height } = this.editor.getClientRects()[0];
    let isBelow = (innerHeight - (top + height)) > POPOVER_MAX_HEIGHT;
    let position = { top : (top + height + 1), left: left};
    if (!isBelow) {
      let bottom = innerHeight - top;
      position = { bottom: bottom, left: left };
    }
    return position;
  }

  getPopoverStyle = () => {
    let defaultPosition = { 
      position: 'absolute',
    };
    let position = this.caculatePopoverPosition();
    return Object.assign({}, {...defaultPosition}, {...position});
  }

  updateValue = (newValue) => {
    this.setState({ newValue }, () => {
      this.onCommit(newValue);
    });
  }

  render() {
    let { column, isReadOnly } = this.props;
    let selectedOptions = this.formatOptions();
    let options = column.data && (column.data.options || []);
    let popoverStyle = null;
    let { isPopoverShow } = this.state;
    if (this.isEditorMounted && isPopoverShow) { // after component mounted;
      popoverStyle = this.getPopoverStyle();
    }
    return (
      <div className="cell-editor grid-cell-type-single-select">
        <div ref={this.setEditorRef} className="select-editor-container" onClick={this.onAddOptionToggle}>
          {selectedOptions.length > 0 && selectedOptions.map((option) => {
            return (
              <SelectEditorOption 
                key={option.id}
                option={option} 
                isShowRemoveIcon={true} 
                onDeleteSelectOption={this.onDeleteSelectOption.bind(this, option)}
              /> 
            );
          })}
        </div>
        {selectedOptions.length === 0 &&
          <div className="select-editor-add" onClick={this.onAddOptionToggle}>{gettext('Add an option')}</div>
        }
        <MediaQuery query="(min-width: 768px)">
          {isPopoverShow &&
            <SelectEditorPopover 
              popoverStyle={popoverStyle}
              options={options}
              selectedOptions={selectedOptions}
              onAddNewOption={this.onAddNewOption}
              onOptionItemToggle={this.onOptionItemToggle}
            />
          }
        </MediaQuery>
        <MediaQuery query="(max-width: 767.8px)">
          {isPopoverShow &&
            <div className="cell-viewer-mobile-mask" ref={ref => this.MobileMask = ref}>
              <MultipSelectView
                column={this.props.column}
                value={this.state.newValue}
                onCommit={this.updateValue}
                closeEditor={this.onAddOptionToggle}
                isReadOnly={isReadOnly}
              />
            </div>
          }
        </MediaQuery>
      </div>
    );
  }
}

MutipleSelectEditor.propTypes = propTypes;

export default MutipleSelectEditor;
