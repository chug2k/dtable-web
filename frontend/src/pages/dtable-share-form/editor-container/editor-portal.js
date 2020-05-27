import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

const propTypes = {
  children: PropTypes.node.isRequired,
  target: PropTypes.instanceOf(Element).isRequired
};
 
class EditorPortal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isMounted: false
    };
    this.el = document.createElement('div');
  }


  componentDidMount() {
    this.props.target.appendChild(this.el);
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ isMounted: true });
  }

  componentWillUnmount() {
    this.props.target.removeChild(this.el);
  }

  render() {
    // Don't render the portal until the component has mounted,
    // So the portal can safely access the DOM.
    if (!this.state.isMounted) {
      return null;
    }

    return ReactDOM.createPortal(this.props.children, this.el);
  }
}

EditorPortal.propTypes = propTypes;

export default EditorPortal;
