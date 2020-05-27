import React from 'react';
import PropTypes from 'prop-types';
import { processor } from '@seafile/seafile-editor/dist/utils/seafile-markdown2html';
import Loading from '../../../components/loading';

const propTypes = {
  newValue: PropTypes.object,
  onContentClick: PropTypes.func.isRequired,
};

class LongTextEditorPreviewAll extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      innerHtml: null,
      isFormatValue: true,
    };
  }

  componentDidMount() {
    let newValue = this.props.newValue;
    let mdFile = newValue ? newValue.text : '';
    if (mdFile) {
      this.formatterLongTextValue(mdFile);
    } else {
      this.setState({
        isFormatValue: false,
        innerHtml: ''
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    let mdFile = nextProps.newValue.text;
    this.formatterLongTextValue(mdFile);
  }

  formatterLongTextValue = (mdFile) => {
    processor.process(mdFile).then((result) => {
      let innerHtml = String(result);
      this.setState({
        isFormatValue: false,
        innerHtml: innerHtml
      });
    });
  }

  render() {
    if (this.state.isFormatValue) {
      return <Loading />;
    }

    return (
      <div className="long-text-editor-container article" onClick={this.props.onContentClick}>
        <div dangerouslySetInnerHTML={{__html: this.state.innerHtml}}></div>
      </div>
    );
  }

}

LongTextEditorPreviewAll.propTypes = propTypes;

export default LongTextEditorPreviewAll;
