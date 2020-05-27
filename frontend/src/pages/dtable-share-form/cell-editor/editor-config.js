import React from 'react';
import { CELL_TYPE } from '../../dtable-share-row/contants/contants';
import CollaboratorEditor from './collaborator-editor';
import SingleSelectEditor from './single-select-editor';
import MutipleSelectDitor from './mutiple-select-editor';
import LongTextEditor from './long-text-editor';
import DateEditor from './date-editor';
import TextEditor from './text-editor';
import NumberEditor from './number-editor';
import CheckboxEditor from './checkbox-editor';
import FileEditor from './file-editor';
import ImageEditor from './image-editor';

import '../css/common-editor.css';

const EditorConfig = {
  [CELL_TYPE.COLLABORATOR]: <CollaboratorEditor />,
  [CELL_TYPE.SINGLE_SELECT]: <SingleSelectEditor />,
  [CELL_TYPE.MULTIPLE_SELECT]: <MutipleSelectDitor />,
  [CELL_TYPE.LONG_TEXT]: <LongTextEditor />,
  [CELL_TYPE.DATE]: <DateEditor />,
  [CELL_TYPE.TEXT]: <TextEditor />,
  [CELL_TYPE.NUMBER]: <NumberEditor />,
  [CELL_TYPE.CHECKBOX]: <CheckboxEditor />,
  [CELL_TYPE.FILE]: <FileEditor />,
  [CELL_TYPE.IMAGE]: <ImageEditor />,
};

export default EditorConfig;