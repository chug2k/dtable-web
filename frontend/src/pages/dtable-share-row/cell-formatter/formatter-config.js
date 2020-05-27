import React from 'react';
import { CELL_TYPE } from '../contants/contants';
import TextFormatter from './text-formatter';
import NumberFormatter from './number-formatter';
import DateFormatter from './date-formatter';
import SingleSelectFormatter from './single-select-formatter';
import MultipleSelectFormatter from './multiple-select-formatter';
import CollaboratorFormatter from './collaborator-formatter';
import CheckboxFormatter from './checkbox-formatter';
import FileFormatter from './file-formatter';
import ImageFormatter from './image-formatter';
import LongTextFormatter from './long-text-formatter';

import '../css/formatter.css';

const FormatterConfig = {
  [CELL_TYPE.TEXT]: <TextFormatter />,
  [CELL_TYPE.NUMBER]: <NumberFormatter />,
  [CELL_TYPE.DATE]: <DateFormatter />,
  [CELL_TYPE.CHECKBOX]: <CheckboxFormatter />,
  [CELL_TYPE.SINGLE_SELECT]: <SingleSelectFormatter />,
  [CELL_TYPE.MULTIPLE_SELECT]: <MultipleSelectFormatter />,
  [CELL_TYPE.COLLABORATOR]: <CollaboratorFormatter />,
  [CELL_TYPE.FILE]: <FileFormatter />,
  [CELL_TYPE.IMAGE]: <ImageFormatter />,
  [CELL_TYPE.LONG_TEXT]: <LongTextFormatter />,
};

export default FormatterConfig; 