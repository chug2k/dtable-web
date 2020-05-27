import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Utils } from '../../../utils/utils';
import { gettext } from '../../../utils/constants';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import Loading from '../../../components/loading';
import LoadMore from '../../../components/load-more';

const propTypes = {
  workspace: PropTypes.object.isRequired,
  dtable: PropTypes.object.isRequired,
  toggleCancel: PropTypes.func.isRequired,
};

class TableSnapshotsDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isSnapshotsLoading: true,
      snapshots: [],
      errorMsg: null,
      page: 1,
      perPage: 20,
      hasNextPage: false,
      isLoadingMore: false,
    };
  }

  componentDidMount() {
    let { page , perPage } = this.state;
    this.loadSnapshots(page, perPage);
  }

  loadSnapshots = (page, perPage) => {
    let { workspace, dtable } = this.props;
    dtableWebAPI.listDTableSnapshots(workspace.id, dtable.name, page, perPage).then((res) => {
      let snapshots = this.state.snapshots.slice(0);
      snapshots = snapshots.concat(res.data.snapshot_list);
      this.setState({
        snapshots: snapshots,
        page: res.data.page_info.current_page,
        hasNextPage: res.data.page_info.has_next_page,
        isSnapshotsLoading: false,
        isLoadingMore: false,
        errorMsg: null
      });
    }).catch(error => {
      this.setState({
        isLoadingMore: false,
        isSnapshotsLoading: false,
      });
      let errorMsg = Utils.getErrorMsg(error, true);
      this.setState({errorMsg: errorMsg});
    });
  }

  onLoadMoreSnapshots = () => {
    if (this.state.hasNextPage) {
      let nextPage = this.state.page + 1;
      this.setState({isLoadingMore: true}, () => {
        this.loadSnapshots(nextPage, this.state.perPage);
      });
    }
  }

  toggle = () => {
    this.props.toggleCancel();
  }

  render() {
    let { server } = window.app.pageOptions;
    let { workspace, dtable } = this.props;
    let { isSnapshotsLoading, isLoadingMore, snapshots, errorMsg } = this.state;
    return (
      <Modal isOpen={true} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}><span className="op-target">{dtable.name}</span>{' '}{gettext('snapshots')}</ModalHeader>
        <ModalBody className="dtable-snapshots-container">
          {isSnapshotsLoading && <Loading />}
          {!isSnapshotsLoading && errorMsg && <p className="d-flex justify-content-center pt-2 error">{errorMsg}</p>}
          {!isSnapshotsLoading && !errorMsg && snapshots.length === 0 && <p className="d-flex justify-content-center pt-2">{gettext('No Snapshots')}</p>}
          {!isSnapshotsLoading && !errorMsg && snapshots.length > 0  && (
            <div className="dtable-snapshots-content">
              <table className="table-thead-hidden">
                <thead>
                  <tr>
                    <th width="50%">{gettext('Time')}</th>
                    <th width="20%">{gettext('View')}</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snapshot, index) => {
                    let viewLink = `${server}/dtable/snapshots/workspace/${workspace.id}/dtable/${dtable.name}/${snapshot.commit_id}/`;

                    return (
                      <tr key={index}>
                        <td><div className="ml-6">{moment(snapshot.ctime).format('YYYY-MM-DD HH:mm')}</div></td>
                        <td className="text-center"><a href={viewLink} target="_blank" rel="noopener noreferrer" className="cursor-pointer">{gettext('View')}</a></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {this.state.hasNextPage && <LoadMore marginTop={'1rem'} isLoadingMore={isLoadingMore} onLoadMore={this.onLoadMoreSnapshots}/>}
            </div>
          )}
        </ModalBody>
      </Modal>
    );
  }
}

TableSnapshotsDialog.propTypes = propTypes;

export default TableSnapshotsDialog;
