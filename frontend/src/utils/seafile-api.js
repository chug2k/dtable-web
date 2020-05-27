import cookie from 'react-cookies';
import { SeafileAPI } from 'seafile-js';
import { siteRoot } from './constants';

let seafileAPI = new SeafileAPI();
let xcsrfHeaders = cookie.load('dtable_csrftoken');
seafileAPI.initForSeahubUsage({ siteRoot, xcsrfHeaders });

export { seafileAPI };
