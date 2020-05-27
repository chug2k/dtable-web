import React from 'react';
import PropTypes from 'prop-types';
import CommonDatasetItem from './dataset-item';

class CommonDatasetList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isItemFreezed: false,
    };
  }

  onFreezedItem = () => {
    this.setState({isItemFreezed: true});
  }

  onUnfreezedItem = () => {
    this.setState({isItemFreezed: false});
  }

  deleteDataset = (dataset) => {
    this.props.deleteDataset(dataset);
  }

  render() {
    let { datasetList } = this.props;
    return datasetList.map((dataset, index) => {
      return (
        <CommonDatasetItem
          key={index}
          dataset={dataset}
          deleteDataset={this.deleteDataset}
          isItemFreezed={this.state.isItemFreezed}
          onFreezedItem={this.onFreezedItem}
          onUnfreezedItem={this.onUnfreezedItem}
        />
      );
    });
  }
}

const propTypes = {
  datasetList: PropTypes.array.isRequired,
  deleteDataset: PropTypes.func.isRequired,
};

CommonDatasetList.propTypes = propTypes;

export default CommonDatasetList;
