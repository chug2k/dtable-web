import NP from 'number-precision';

export const formatNumberValue = (value, format) => {
  if (typeof value !== 'number') {
    return value;
  }
  const commaValue = _toThousands(value);
  const moneyCommaValue = _toThousands(value.toFixed(2), true);
  switch(format) {
    case 'number':
      return value;
    case 'number-with-commas':
      return commaValue;
    case 'percent':
      return `${value * 100}%`;
    case 'yuan':
      return `￥${moneyCommaValue}`;
    case 'dollar':
      return `$${moneyCommaValue}`;
    case 'euro':
      return `€${moneyCommaValue}`;
    default:
      return value;
  }
};

export const formatDateValue = (value, format) => {
  if (value === '' || !value) {
    return value;
  }
  // Compatible with older versions: if format is null, use defaultFormat
  let newValue = value.split(' ');
  let cellDate = newValue[0].split('-');
  switch(format) {
    case 'M/D/YYYY HH:mm':
      return newValue[1] ? `${Number(cellDate[1])}/${Number(cellDate[2])}/${cellDate[0]} ${newValue[1]}` : `${Number(cellDate[1])}/${Number(cellDate[2])}/${cellDate[0]}`;
    case 'D/M/YYYY HH:mm':
      return newValue[1] ? `${Number(cellDate[2])}/${Number(cellDate[1])}/${cellDate[0]} ${newValue[1]}` : `${Number(cellDate[2])}/${Number(cellDate[1])}/${cellDate[0]}`;
    case 'YYYY-MM-DD HH:mm':
      return value;
    case 'M/D/YYYY':
      return `${Number(cellDate[1])}/${Number(cellDate[2])}/${cellDate[0]}`;
    case 'D/M/YYYY':
      return `${Number(cellDate[2])}/${Number(cellDate[1])}/${cellDate[0]}`;
    case 'YYYY-MM-DD':
      return `${cellDate[0]}-${cellDate[1]}-${cellDate[2]}`;
    default:
      return value;
  }
};

function _toThousands(num, isCurrency) {
  let integer = Math.trunc(num);
  let decimal = String(Math.abs(NP.minus(num, integer))).slice(1);
  if (isCurrency) {
    if (decimal.length === 2) {
      decimal = decimal.padEnd(3, '0');
    } else {
      decimal = decimal.substring(0, 3).padEnd(3, '.00');
    }
  }
  let result = [], counter = 0;
  integer = Object.is(integer, -0) ? ['-', '0'] : integer.toString().split('');
  for (var i = integer.length - 1; i >= 0; i--) {
    counter++;
    result.unshift(integer[i]);
    if (!(counter % 3) && i !== 0) {
      result.unshift(',');
    }
  }
  return result.join('') + decimal;
}

const FILEEXT_ICON_MAP = {
  // text file
  'md': 'txt.png',
  'txt': 'txt.png',

  // pdf file
  'pdf' : 'pdf.png',

  // document file
  'doc' : 'word.png',
  'docx' : 'word.png',
  'odt' : 'word.png',
  'fodt' : 'word.png',

  'ppt' : 'ppt.png',
  'pptx' : 'ppt.png',
  'odp' : 'ppt.png',
  'fodp' : 'ppt.png',

  'xls' : 'excel.png',
  'xlsx' : 'excel.png',
  'ods' : 'excel.png',
  'fods' : 'excel.png',

  // video
  'mp4': 'video.png',
  'ogv': 'video.png',
  'webm': 'video.png',
  'mov': 'video.png',
  'flv': 'video.png',
  'wmv': 'video.png',
  'rmvb': 'video.png',

  // music file
  'mp3' : 'music.png',
  'oga' : 'music.png',
  'ogg' : 'music.png',
  'flac' : 'music.png',
  'aac' : 'music.png',
  'ac3' : 'music.png',
  'wma' : 'music.png',

  // image file
  'jpg' : 'pic.png',
  'jpeg' : 'pic.png',
  'png' : 'pic.png',
  'svg' : 'pic.png',
  'gif' : 'pic.png',
  'bmp' : 'pic.png',
  'ico' : 'pic.png',

  // folder dir
  'folder': 'folder-192.png',

  // default
  'default' : 'file.png'
};

export const getFileIconUrl = (mediaUrl, filename, direntType) => {
  let commonUrl = '';
  let file_ext = '';
  if (filename.lastIndexOf('.') === -1) {
    commonUrl = 'img/file/192/' + FILEEXT_ICON_MAP['default'];
  } else {
    file_ext = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase();
  }

  if (FILEEXT_ICON_MAP[file_ext]) {
    commonUrl = 'img/file/192/' + FILEEXT_ICON_MAP[file_ext];
  } else if (direntType === 'dir') {
    commonUrl = 'img/' + FILEEXT_ICON_MAP['folder'];
  } else {
    commonUrl = 'img/file/192/' + FILEEXT_ICON_MAP['default'];
  }

  let url = mediaUrl + commonUrl;
  return url;
};