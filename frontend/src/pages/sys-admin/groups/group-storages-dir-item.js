import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from '@reach/router';
import moment from 'moment';
import { Utils } from '../../../utils/utils';

function DirItem (props) {

  let dirent = props.dirent;
  let iconUrl = Utils.getDirentIcon(dirent);

  function openFolder () {
    props.openFolder(props.dirent);
  }

  return (
    <Fragment>
      <tr>
        <td className="text-center"><img src={iconUrl} width="24" alt='' /></td>
        <td>
          {dirent.is_file ?
            dirent.name :
            <Link to="#" onClick={openFolder}>{dirent.name}</Link>
          }
        </td>
        <td>{dirent.is_file ? Utils.bytesToSize(dirent.size) : ''}</td>
        <td>{moment(dirent.mtime).fromNow()}</td>
      </tr>
    </Fragment>
  );
}

const propTypes = {
  dirent: PropTypes.object.isRequired,
  openFolder: PropTypes.func.isRequired
};
DirItem.propTypes = propTypes;
export default DirItem;