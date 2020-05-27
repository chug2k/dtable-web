import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import toaster from '../../../components/toast';
import Loading from '../../../components/loading';
import { Utils } from '../../../utils/utils';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import HeaderIconConfig from '@seafile/dtable/lib/lib/cells/HeaderIconConfig';
import getPreviewContent from '../../dtable-share-form/utils/markdown-utils';
import { formatDateValue, formatNumberValue, getFileIconUrl } from '../../dtable-share-row/utils/utils';
import '../css/dataset-dialog.css';

const { mediaUrl } = window.app.config;

const propTypes = {
  dataset: PropTypes.object.isRequired,
  toggle: PropTypes.func.isRequired,
};

class DatasetDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      errorMsg: null,
      loading: true,
      tableData: null,
    };
  }

  componentDidMount() {
    const { dataset } = this.props;
    if (!dataset || !dataset.id) return;
    dtableWebAPI.getCommonDataset(dataset.id).then(res => {
      this.setState({
        loading: false,
        tableData: res.data,
      });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      this.setState({errorMsg: errMessage});
      toaster.danger(errMessage);
    });
  }

  toggle = () => {
    this.props.toggle();
  }

  render() {
    const { dataset } = this.props;
    let { loading, tableData, errorMsg } = this.state;
    return (
      <Modal className="dataset-dialog" isOpen={true} toggle={this.toggle} size="lg">
        <ModalHeader toggle={this.toggle}>{dataset.dataset_name}</ModalHeader>
        <ModalBody>
          {loading ?
            <Loading /> :
            <Content errorMsg={errorMsg} tableData={tableData}/>
          }
        </ModalBody>
      </Modal>
    );
  }
}

DatasetDialog.propTypes = propTypes;

function Content (paras) {
  const { tableData, errorMsg } = paras;
  if (errorMsg) {
    return <p className="error text-center">{errorMsg}</p>;
  }
  const { rows, columns } = tableData;
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => {
            const { type, width, key } = column;
            const columnType = type || 'default';
            if (columnType === 'link') return null;
            return (
              <th key={key} style={{width: width}}>
                <span className="header-icon">
                  <i className={HeaderIconConfig[columnType]}></i>
                </span>
                <span className="header-name">{column.name}</span>
              </th>
            );
          })}
        </tr>
      </thead>
      {rows &&
        <tbody>
          {rows.map((row, index) => {
            return (<Item key={index} index={index} row={row} tableData={tableData}/>);
          })}
        </tbody>
      }
    </table>
  );
}

function getOptionIdByName(column, optionName) {
  if (!column.data) return null;
  const options = column.data.options;
  let option = options.find(item => { return item.name === optionName;});
  return option || null;
}

function getOptionsIdByNames(column, optionNames) {
  let options = [];
  for (let i = 0; i < optionNames.length; i++) {
    const option = getOptionIdByName(column, optionNames[i]);
    if (option) options.push(option);
  }
  return options;
}

function renderLongTextImages(images) {
  let imagesDom = images.map((image, index) => {
    return <img src={image} alt="" key={index}/>;
  });
  return (
    <span className="longtext-icon-container longtext-formatter-image-container">
      {imagesDom}<i className="image-number">{'+'}{images.length}</i>
    </span>
  );
}

function renderLongText(markdown) {
  const { previewText, images, links } = getPreviewContent(markdown);
  const linksLen = links ? links.length : 0;
  const imagesLen = images ? images.length : 0;
  return (
    <div className="longtext-formatter">
      {linksLen > 0 &&
        <span className="longtext-icon-container longtext-formatter-links-container">
          <i className="dtable-font dtable-icon-url"></i>{links.length}
        </span>
      }
      {imagesLen > 0 && renderLongTextImages(images)}
      <span className="longtext-formatter-preview-container">{previewText}</span>
    </div>
  );
}

function renderCollaborators(cellValue, related_user_list) {
  let collaborators = [];
  cellValue.forEach((email, index) => {
    const user = related_user_list.find(user => user.email === email);
    if (user) {
      collaborators.push(
        <div className="collaborator" key={index}>
          <span className="collaborator-avatar-container">
            <img className="collaborator-avatar" alt={user.name} src={user.avatar_url}/>
          </span>
          <span className="collaborator-name">{user.name}</span>
        </div>
      );
    }
  });
  return <div className="collaborators-formmatter"><div className="formmatter-show">{collaborators}</div></div>;
}

function renderDate(cellValue, data) {
  let format = (data && data.format) ? data.format : 'YYYY-MM-DD';
  let formatedDate = formatDateValue(cellValue, format);
  return <div className="text-right">{formatedDate}</div>;
}

function renderNumber(cellValue, data) {
  let formatType = (data && data.format) ? data.format : 'number';
  let formatedNumber = cellValue !== '' ? formatNumberValue(cellValue, formatType) : cellValue;
  return <div className="text-right">{formatedNumber}</div>;
}

function renderImage(cellValue) {
  let imagesArr = [];
  cellValue.forEach((item, index) => {
    imagesArr.push(<img src={item} alt='' width='28px' key={index}></img>);
  });
  return <div className="image-formatter">{imagesArr}</div>;
}

function renderFile(cellValue) {
  let filesArr = [];
  if (Array.isArray(cellValue)) {
    filesArr = cellValue.map((item, index) => {
      return <img key={index} src={getFileIconUrl(mediaUrl, item.name, item.type)} title={item.name} alt=''/>;
    });
  }
  return <div className="file-formatter">{filesArr}</div>;
}

function renderSingleSelect(column, cellValue) {
  const option = getOptionIdByName(column, cellValue);
  const { name, color } = option;
  return <div><div className="single-select" style={{backgroundColor: color}}>{name}</div></div>;
}

function renderMultiSelect(column, cellValue) {
  let optionIDs = getOptionsIdByNames(column, cellValue);
  let options = optionIDs.map((option, index) => {
    return (
      <div key={index} className="multiple-select" style={{backgroundColor: option.color}}>{option.name}</div>
    );
  });
  return <div className="multiple-selects-formatter"><div className="formatter-show">{options}</div></div>;
}

function covertRow(row, column, related_user_list) {
  if (!row || !column) {
    return null;
  }
  const { name, type, data } = column;
  const cellValue = row[name];
  if (!cellValue) {
    return null;
  }
  let result;
  switch (type) {
    case 'text':
      result = <div className="text-formatter">{cellValue}</div>;
      break;
    case 'long-text':
      result = renderLongText(cellValue);
      break;
    case 'image':
      result = renderImage(cellValue);
      break;
    case 'file':
      result = renderFile(cellValue);
      break;
    case 'collaborator':
      result = renderCollaborators(cellValue, related_user_list);
      break;
    case 'single-select':
      result = renderSingleSelect(column, cellValue);
      break;
    case 'multiple-select':
      result = renderMultiSelect(column, cellValue);
      break;
    case 'link':
      break;
    case 'date':        
      result = renderDate(cellValue, data);
      break;
    case 'number':
      result = renderNumber(cellValue, data);
      break;
    case 'checkbox':
      if (cellValue) {
        result = <input className="checkbox" type="checkbox" readOnly defaultChecked></input>;
      } else {
        result = <input className="checkbox" type="checkbox" readOnly></input>;
      }        
      break;
    default:
      result = cellValue.toString();
  }
  return result;
}

const ItemPropTypes = {
  tableData: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
};

function Item (props) {
  const { tableData, index, row } = props;
  const { related_user_list, columns } = tableData;
  return (
    <tr key={index}>
      {columns.map((column, index) => {
        if (column.type === 'link') return null;
        return <td key={index}>{covertRow(row, column, related_user_list)}</td>;
      })}
    </tr>
  );
}

Item.propTypes = ItemPropTypes;

export default DatasetDialog;
