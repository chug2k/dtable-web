import React from 'react';
import { gettext } from '../../../utils/constants';
import { getFileIconUrl } from '../../dtable-share-row/utils/utils';
import { CELL_TYPE } from '../../dtable-share-row/contants/contants';
import SelectOption from '../../dtable-share-row/cell-formatter-widgets/select-option';

const nullValue = <span className="null-value">{gettext('Empty')}</span>;

const getMultipleSelectFormat = (value, column) => {
  if (!Array.isArray(value) || value.length === 0) {
    return nullValue;
  }
  
  let validOptions = [];
  let options = column.data && column.data.options ? column.data.options : [];
  value.forEach((optionID, index) => {
    let option = options.find(option => option.id === optionID);
    if (option) {
      validOptions.push(
        <SelectOption value={optionID} column={column} key={`activity-multiple-select-${index}`} />
      );
    }
  });
  return validOptions.length === 0 ? nullValue : validOptions;
};

const getSingleSelectFormat = (optionID, column) => {
  if (typeof optionID !== 'string') {
    return nullValue;
  }

  let options = column.data && column.data.options ? column.data.options : [];
  let option = options.find(option => option.id === optionID);
  if (option) {
    return <SelectOption value={optionID} column={column} />;
  }
  return nullValue;
};

const getCollaboratorFormat = (value, collaboratorsMap) => {
  if (!Array.isArray(value) || value.length === 0) {
    return nullValue;
  }

  let validCollaborators = [];
  value.forEach((item, index) => {
    let collaborator = collaboratorsMap[item];
    if (collaborator) {
      validCollaborators.push(
        <div key={`activity-collaborator-${index}`} className="activity-collaborator">
          <span className="collaborator-avatar-container">
            <img className="collaborator-avatar" alt={collaborator.name} src={collaborator.avatar_url} />
          </span>
          <span className="collaborator-name">{collaborator.name}</span>
        </div>
      );
    }
  });
  return validCollaborators.length === 0 ? nullValue : validCollaborators;
};

const getFileFormat = (value, isExpand) => {
  if (!Array.isArray(value) || value.length === 0) {
    return nullValue;
  }

  const { mediaUrl } = window.app.config;
  if (isExpand) {
    return value.map((item, index) => {
      return <img className="activity-file-item" src={getFileIconUrl(mediaUrl, item.name, item.type)} alt="" key={`activity-file-${index}`}></img>;
    });
  }
  return (<span className="activity-file">
    <img className="activity-file-item" src={getFileIconUrl(mediaUrl, value[0].name, value[0].type)} alt=""></img>
    {value.length !== 1 &&
      <span className="file-value-count">{`+${value.length}`}</span>
    }
  </span>);
};

const getImageFormat = (value, isExpand) => {
  if (!Array.isArray(value) || value.length === 0) {
    return nullValue;
  }

  if (isExpand) {
    return value.map((item, index) => {
      return <img className="activity-file-item" src={item} alt="" key={`activity-image-${index}`}></img>;
    });
  }
  return (<span className="activity-file">
    <img className="activity-file-item" src={value[0]} alt=""></img>
    {value.length !== 1 &&
      <span className="file-value-count">{`+${value.length}`}</span>
    }
  </span>); 
};

const getCheckboxFormat = (value) => {
  return <input className="checkbox" type='checkbox' readOnly checked={value ? true : false} />;
};

const getLinkFormat = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return nullValue;
  }

  return value.map((item, index) => {
    if ((typeof item) !== 'object') {
      return nullValue;
    }

    return (<span className="activity-link-item" key={`activity-link-${index}`}>{Object.values(item)[0]}</span>);
  });
};

const getLongTextFormat = (value, isExpand) => {
  if ((typeof value) !== 'object' || !value.text) {
    return nullValue;
  }

  let { links, images, preview } = value;
  return (
    <div className={`activity-longtext-item ${isExpand ? '' : 'activity-longtext-item-hide'}`}>
      {createLinkContent(links)}
      {createImagesContent(images)}
      {createTextContent(preview)}
    </div>
  );
};

const createTextContent = (textValue) =>  {
  if (typeof  textValue !== 'string') {
    return nullValue;
  }

  return <span className="activity-longtext-content-item">{textValue}</span>;
};

const createLinkContent = (links) => {
  if (!Array.isArray(links) || links.length === 0) {
    return null;
  }

  return (
    <span className="activity-longtext-icon-container activity-longtext-link-item">
      <i className="dtable-font dtable-icon-url"></i>{links.length}
    </span> 
  );
};

const createImagesContent = (images) => {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }
  return (
    <span className="activity-longtext-icon-container activity-longtext-image-item">
      <img src={images[0]} alt=""/>
      <i className="image-number">{images.length > 1 ? '+' + images.length : null}</i>
    </span>
  );
};

const getGeolocationFormatter = (value) => {
  if (typeof value !== 'object') {
    return nullValue;
  }
  return <span>{`${value.province || ''} ${value.city || ''} ${value.district || ''} ${value.detail || ''}`}</span>;
};

const getFormattedCellValueItem = (cell, isExpand, collaboratorsMap) => {
  let { value, old_value, column_type, column_data, column_key, column_name } = cell;
  let cellValue = value;
  let cellOldValue = old_value;
  let column = {
    key: column_key,
    type: column_type,
    data: column_data,
    name: column_name,
  };
  switch(column_type) {
    case CELL_TYPE.TEXT: {
      cellValue = typeof cellValue === 'string' ? (cellValue || nullValue) : nullValue;
      cellOldValue = typeof cellOldValue === 'string' ? (cellOldValue || nullValue) : nullValue;
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.SINGLE_SELECT: {
      cellValue = getSingleSelectFormat(cellValue, column);
      cellOldValue = getSingleSelectFormat(cellOldValue, column);
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.MULTIPLE_SELECT: {
      cellValue = getMultipleSelectFormat(cellValue, column);
      cellOldValue = getMultipleSelectFormat(cellOldValue, column);
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.FILE: {
      cellValue = getFileFormat(cellValue, isExpand);
      cellOldValue = getFileFormat(cellOldValue, isExpand);
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.IMAGE: {
      cellValue = getImageFormat(cellValue, isExpand);
      cellOldValue = getImageFormat(cellOldValue, isExpand);
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.CHECKBOX: {
      cellValue = getCheckboxFormat(cellValue);
      cellOldValue = getCheckboxFormat(cellOldValue);
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.LONG_TEXT: {
      cellValue = getLongTextFormat(cellValue, isExpand);
      cellOldValue = getLongTextFormat(cellOldValue, isExpand);
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.LINK: {
      cellValue = getLinkFormat(cellValue);
      cellOldValue = getLinkFormat(cellOldValue);
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.COLLABORATOR: {
      cellValue = getCollaboratorFormat(cellValue, collaboratorsMap);
      cellOldValue = getCollaboratorFormat(cellOldValue, collaboratorsMap);
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.NUMBER: {
      if (typeof cellValue !== 'string' && typeof cellValue !== 'number') {
        cellValue = '';
      }
      if (typeof cellOldValue !== 'string' && typeof cellOldValue !== 'number') {
        cellOldValue = '';
      }
      cellValue = cellValue || cellValue === 0 ? cellValue : nullValue;
      cellOldValue = cellOldValue || cellOldValue === 0 ? cellOldValue : nullValue;
      return { cellValue, cellOldValue, column };
    }
    case CELL_TYPE.GEOLOCATION: {
      cellValue = getGeolocationFormatter(cellValue);
      cellOldValue = getGeolocationFormatter(cellOldValue);
      return { cellValue, cellOldValue, column };
    }
    default: {
      cellValue = cellValue || nullValue;
      cellOldValue = cellOldValue || nullValue;
      return { cellValue, cellOldValue, column };
    }
  }
};

const getFormattedCellValue = (rowData, isExpand, collaboratorsMap = {}) => {
  let newValues = [];
  let oldValues = [];
  let columns = [];
  rowData.forEach(cell => {
    let { cellValue, cellOldValue, column } = getFormattedCellValueItem(cell, isExpand, collaboratorsMap);
    newValues.push(cellValue);
    oldValues.push(cellOldValue);
    columns.push(column);
  });
  return { newValues, oldValues, columns };
};

export { getFormattedCellValue };