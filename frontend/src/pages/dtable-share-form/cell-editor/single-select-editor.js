import React from 'react';
import PropTypes from 'prop-types';
import SelectEditorOption from '../cell-editor-widgets/select-editor-option';
import SelectEditorPopover from '../cell-editor-widgets/select-editor-popover';
import MediaQuery from 'react-responsive';
import SingleSelectView from '../cell-viewer-mobile/single-select-view';
import { gettext } from '../../../utils/constants';

import '../css/select-editor.css';

const propTypes = {
  isReadOnly: PropTypes.bool,
  value: PropTypes.string,
  column: PropTypes.object,
  onCommit: PropTypes.func,
};

const POPOVER_MAX_HEIGHT = 200;

class SingleSelectEditor extends React.Component {

  static defaultProps = {
    isReadOnly: false,
    value: ''
  }

  constructor(props) {
    super(props);
    this.state = {
      newValue: null,
      isPopoverShow: false,
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

  formatOption = () => {
    let { column } = this.props;
    let newValue = this.state.newValue;
    if (!newValue) {
      return null;
    }

    let options = (column && column.data && column.data.options) || [];
    let option = options.find(option => option.id === newValue);
    return option;
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

  onOptionItemToggle = (option) => {
    let { newValue } = this.state;

    if (newValue === option.id) {
      return;
    }

    this.setState({newValue: option.id}, () => {
      this.onCommit(option.id);
    });
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

  render() {
    let { column, isReadOnly } = this.props;
    let option = this.formatOption();
    let options = column.data && (column.data.options || []);
    let selectedOptions = option ? [option] : [];
    let popoverStyle = null;
    let { isPopoverShow } = this.state;
    if (this.isEditorMounted && isPopoverShow) { // after component mounted;
      popoverStyle = this.getPopoverStyle();
    }
    return (
      <div className="cell-editor grid-cell-type-single-select">
        <div ref={this.setEditorRef} className="select-editor-container" onClick={this.onAddOptionToggle}>
          {option && <SelectEditorOption option={option} />}
        </div>
        {!option && <div className="select-editor-add" onClick={this.onAddOptionToggle}>{gettext('Add an option')}</div>}
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
              <SingleSelectView
                column={this.props.column}
                value={this.state.newValue}
                onCommit={this.onOptionItemToggle}
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

SingleSelectEditor.propTypes = propTypes;

export default SingleSelectEditor;
