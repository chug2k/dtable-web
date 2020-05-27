import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

const { formID } = window.shared.pageOptions;

class ImageThumbnail extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  toggle = () => {
    this.setState({ open: !this.state.open });
  }

  render() {
    let { src, name, id } = this.props;
    src += '?token=' + formID;
    return (
      <Fragment>
        <img alt='' src={src} id={`thumbnail-${id}`}/>
        <Tooltip placement='bottom' isOpen={this.state.open} toggle={this.toggle} target={`thumbnail-${id}`} delay={{show: 0, hide: 0 }} fade={'false'} >
          {name}
        </Tooltip>
      </Fragment>
    );
  }
}

const ImageThumbnailPropTypes = {
  src: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

ImageThumbnail.propTypes = ImageThumbnailPropTypes;

export default ImageThumbnail;