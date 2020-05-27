import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../../../utils/constants';
import Loading from '../../../components/loading';
import DirItem from './group-storages-dir-item';

function DirContent (props) {

  let { loading, errorMsg, direntList, openFolder } = props;

  if (loading) {
    return <Loading />;
  } else if (errorMsg) {
    return <p className="error text-center mt-4">{errorMsg}</p>;
  } else {
    return (
      <Fragment>
        <table className="table-hover">
          <thead>
            <tr>
              <th width="5%">{/*icon*/}</th>
              <th width="55%">{gettext('Name')}</th>
              <th width="25%">{gettext('Size')}</th>
              <th width="15%">{gettext('Last Update')}</th>
            </tr>
          </thead>
          <tbody>
            {direntList.map((dirent, index) => {
              return <DirItem
                key={index}
                dirent={dirent}
                openFolder={openFolder}
              />;
            })}
          </tbody>
        </table>
      </Fragment>
    );
  }
}

const propTypes = {
  loading: PropTypes.bool.isRequired,
  errorMsg: PropTypes.string.isRequired,
  direntList: PropTypes.array.isRequired,
  openFolder: PropTypes.func.isRequired,
};
DirContent.propTypes = propTypes;
export default DirContent;
