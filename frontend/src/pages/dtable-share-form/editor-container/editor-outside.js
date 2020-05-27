import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  children: PropTypes.element.isRequired,
  onClickOutside: PropTypes.func.isRequired
};

class EditorOutside extends React.Component {

  constructor(props) {
    super(props);
    this.isClickedInside = false;
  }

  componentDidMount() {
    document.addEventListener('click', this.handleDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  handleDocumentClick = (e) => {
    if (this.isClickedInside) {
      this.isClickedInside = false;
      return;
    }

    this.props.onClickOutside(e);
  };

  handleClick = () => {
    this.isClickedInside = true;
  };

  render() {
    return React.cloneElement(React.Children.only(this.props.children), {onClickCapture: this.handleClick});
  }
}

EditorOutside.propTypes = propTypes;

export default EditorOutside;
