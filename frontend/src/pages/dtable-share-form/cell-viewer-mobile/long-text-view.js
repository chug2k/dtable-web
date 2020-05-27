import React from 'react';
import PropTypes from 'prop-types';
import { TextareaItem } from 'antd-mobile';
import * as zIndexes from '../utils/zIndexes';
import getPreviewContent from '../utils/markdown-utils';
import MobileCommonHeader from './mobile-common-header';

const propTypes = {
  column: PropTypes.object,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onCommit: PropTypes.func,
  closeEditor: PropTypes.func,
};

class LongTextView extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      value: (props.value && props.value.text) ? props.value.text : '', 
    };
    const offsetWidth = document.body.offsetWidth;
    this.rowCounts = offsetWidth < 767.8 ? 10 : 20;
  }

  componentDidMount() {
    history.pushState(null, null, '#');
    window.addEventListener('popstate', this.handleHistaryBack, false); 
    this.timer = setInterval(() => {
      this.saveValue();
    }, 60000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    window.removeEventListener('popstate', this.handleHistaryBack, false);
  }

  handleHistaryBack = (e) => {
    e.preventDefault();
    this.props.closeEditor();
  }

  saveValue = () => {
    const markdownContent = this.state.value;
    const { previewText , images, links } = getPreviewContent(markdownContent);
    const newValue = Object.assign({}, { text: markdownContent, preview: previewText, images: images, links: links });
    this.props.onCommit(newValue);
  }

  closeDialog = () => {
    this.saveValue();
    this.props.closeEditor();
  }

  handleChange = (value) => {
    this.setState({ value });
  }

  render() {
    return (
      <div className="row-expand-view long-text-view" style={{ zIndex: zIndexes.ROW_EXPAND_VIEW }}>
        <MobileCommonHeader
          title={this.props.column.name}
          onLeftClick={this.closeDialog}
          leftName={(<i className="dtable-font dtable-icon-return"></i>)}
        />
        <div className="view-partition view-partition-border-bottom"></div>
        <div className="long-text-container">
          <TextareaItem rows={this.rowCounts} value={this.state.value} onChange={this.handleChange}/>
        </div>
      </div>
    );
  }
}

LongTextView.propTypes = propTypes;

export default LongTextView;