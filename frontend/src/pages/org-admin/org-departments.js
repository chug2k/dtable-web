import React from 'react';
import PropTypes from 'prop-types';
import '../../css/org-department-item.css';

const propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

class OrgDepartments extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="h-100 org-departments">
        {this.props.children}
      </div>
    );
  }
}

OrgDepartments.propTypes = propTypes;

export default OrgDepartments;
