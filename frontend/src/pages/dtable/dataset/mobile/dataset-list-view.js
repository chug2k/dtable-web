import React from 'react';
import PropTypes from 'prop-types';
import CommonDatasetItemView from './dataset-item-view';

class CommonDatasetListView extends React.Component {

  deleteDataset = (dataset) => {
    this.props.deleteDataset(dataset);
  }

  render() {
    let { datasetList } = this.props;
    return datasetList.map((dataset, index) => {
      return (
        <CommonDatasetItemView
          key={index}
          dataset={dataset}
          deleteDataset={this.deleteDataset}
        />
      );
    });
  }
}

const propTypes = {
  datasetList: PropTypes.array.isRequired,
  deleteDataset: PropTypes.func.isRequired,
};

CommonDatasetListView.propTypes = propTypes;

export default CommonDatasetListView;
