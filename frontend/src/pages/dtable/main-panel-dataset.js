import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Loading from '../../components/loading';
import { gettext } from '../../utils/constants';
import { dtableWebAPI } from '../../utils/dtable-web-api';
import { Utils } from '../../utils/utils';
import CommonDatasetList from './dataset/dataset-list';
import CommonDatasetListView from './dataset/mobile/dataset-list-view';
import MediaQuery from 'react-responsive';
import toaster from '../../components/toast';
import EmptyTip from '../../components/empty-tip';

const propTypes = {
  loadWorkspaceList: PropTypes.func.isRequired,
};

class MainPanelDataset extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      datasetList: [],
      errorMsg: null,
      loading: true,
    };
  }

  componentDidMount() {
    dtableWebAPI.listCommonDatasets().then(res => {
      this.setState({
        datasetList: res.data.dataset_list,
        loading: false,
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  deleteDataset = (dataset) => {
    dtableWebAPI.deleteCommonDataset(dataset.id).then(res => {
      let newDatasetList = this.state.datasetList.filter(item => item.id !== dataset.id);
      this.setState({
        datasetList: newDatasetList,
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      toaster.danger(errMessage);
    });
  }

  renameGroupName = () => {
    this.props.loadWorkspaceList();
  }

  render() {
    let { loading, datasetList } = this.state;
    if (loading) {
      return <Loading />;
    }
    return (
      <Fragment>
        <div className="main-panel-center dtable-center">
          <div className="cur-view-container d-flex flex-1 flex-column">
            <div className="cur-view-content">
              {datasetList.length === 0 ?
                <EmptyTip>
                  <Fragment>
                    <h2>{gettext('You don’t have common datasets yet.')}</h2>
                    <p>{gettext('Common datasets can be created from a view of a table. It enable you to share a part of a table to other users.')}</p>
                    <p>{gettext('For example, the sales department maintains a customer list table and makes it into a common dataset. Support team cannot directly access the customer table, but can access the exported dataset and import the records to their support table.')}</p>
                  </Fragment>
                </EmptyTip>
                :
                <Fragment>
                  <div className="workspace">
                    <div className="table-heading">
                      <span>{gettext('Common Datasets')}</span>
                    </div>
                    <div className="table-item-container">
                      <MediaQuery query="(min-width: 767.8px)">
                        <CommonDatasetList 
                          datasetList={datasetList} 
                          deleteDataset={this.deleteDataset}
                        />
                      </MediaQuery>
                      <MediaQuery query="(max-width: 767.8px)">
                        <CommonDatasetListView 
                          datasetList={datasetList} 
                          deleteDataset={this.deleteDataset}
                        />
                      </MediaQuery>
                    </div>
                  </div>
                </Fragment>
              }
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

MainPanelDataset.propTypes = propTypes;

export default MainPanelDataset;
