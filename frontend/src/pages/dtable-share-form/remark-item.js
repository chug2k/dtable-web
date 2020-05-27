import React from 'react';
import PropTypes from 'prop-types';
import { processor } from '@seafile/seafile-editor/dist/utils/seafile-markdown2html';

const propTypes = {
  remarkContent: PropTypes.string,
};

const gettext = window.gettext;

class RemarkItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      noteContent: null
    };
  }

  componentDidMount() {
    const { remarkContent } = this.props;
    this.convertRemarkContent(remarkContent);
  }

  componentWillReceiveProps(nextProps) {
    const { remarkContent } = nextProps;
    this.convertRemarkContent(remarkContent);
  }

  convertRemarkContent = (mdFile) => {
    processor.process(mdFile).then((result) => {
      let noteContent = String(result);
      this.setState({noteContent: noteContent});
    });
  }

  render() {
    const { remarkContent } = this.props;
    return(
      <div className="form_mode compose-editor remark-editor-content">
        <div className="cell-label-container">
          <label className="cell-label">{gettext('Note')}</label>
        </div>
        { remarkContent ? 
          <div 
            className="remark-content-tip"
            dangerouslySetInnerHTML={{ __html: this.state.noteContent }}
          ></div> : 
          <div className="remark-content-tip" style={{color: '#c2c2c2'}}>{gettext('Add notes here to guilde users how to fill the form.')}</div>
        }
      </div>
    );
  }
}

RemarkItem.propTypes = propTypes;

export default RemarkItem;