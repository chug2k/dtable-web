import cookie from 'react-cookies';
import DTableWebAPI  from 'dtable-web-api';
import { siteRoot } from './constants';

let dtableWebAPI = new DTableWebAPI();
let xcsrfHeaders = cookie.load('dtable_csrftoken');
dtableWebAPI.initForDTableUsage({ siteRoot, xcsrfHeaders });

export { dtableWebAPI };
