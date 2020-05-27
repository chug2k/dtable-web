import React from 'react';
import PropTypes from 'prop-types';
import RowItem from '../dtable-share-form/row-item';
import RemarkItem from '../dtable-share-form/remark-item';

const propTypes = {
  currentColumns: PropTypes.array.isRequired,
  remarkContent: PropTypes.string,
  isRemarkContentShow: PropTypes.bool.isRequired
};

class AppFormContent extends React.Component {

  getRowItems = () => {
    let { currentColumns, remarkContent, isRemarkContentShow } = this.props;
    let rowItems = [];
    const disabledType = ['formula', 'link', 'collaborator', 'creator', 'ctime'];
    for (let key in currentColumns) {
      let column = currentColumns[key];
      if (disabledType.includes(column.type)) {
        continue;
      }
      let item = <RowItem key={key} column={column} isReadOnly={true} />;
      rowItems.push(item);
    }
    if (isRemarkContentShow) {
      let remarkItem = <RemarkItem remarkContent={remarkContent} key="remark-item-tip" />;
      rowItems.push(remarkItem);
    }
    return rowItems;
  }

  render() {
    let rowItems = this.getRowItems();
    return (
      <div className="form-items-container">
        {rowItems}
      </div>
    );
  }
}

AppFormContent.propTypes = propTypes;

export default AppFormContent;
