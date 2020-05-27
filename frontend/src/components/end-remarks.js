import React from 'react';
import PropTypes from 'prop-types';
import { mediaUrl } from '../utils/constants';

const propTypes = {
  content: PropTypes.string.isRequired,
};

function EndRemark(props) {
  return (
    <div className="form-share-end-remark-container">
      <img src={`${mediaUrl}img/submit-success.png`} alt="" width="100" height="100" className="submit-success-icon" />
      <div className="form-share-end-remark-content">{props.content}</div>
    </div>
  );
}

EndRemark.propTypes = propTypes;

export default EndRemark;