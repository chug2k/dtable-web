import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import MediaQuery from 'react-responsive';
import { dtableWebAPI } from '../../../utils/dtable-web-api';
import { gettext } from '../../../utils/constants';
import SearchResultItem from './search-result-item';
import Workspace from '../model/workspace';

const propTypes = {
  isPublic: PropTypes.bool,
  repoID: PropTypes.string,
  placeholder: PropTypes.string,
  onSearchedClick: PropTypes.func.isRequired,
};

class SearchDtable extends Component {

  constructor(props) {
    super(props);
    this.state = {
      width: 'default',
      value: '',
      resultItems: [],
      isMaskShow: false,
      isResultShow: false,
      isResultGetted: false,
      isCloseShow: false,
      isSearchInputShow: false, // for mobile
    };
    this.inputValue = '';
  }

  onFocusHandler = () => {
    this.setState({
      width: '30rem',
      isMaskShow: true,
      isCloseShow: true
    });
  }

  onCloseHandler = () => {
    this.resetToDefault();
  }

  onItemClickHandler = (item) => {
    this.resetToDefault();
    this.props.onSearchedClick(item);
  }

  onChangeHandler = (event) => {
    let _this = this;
    this.setState({value: event.target.value});
    let newValue = event.target.value;
    if (this.inputValue === newValue.trim()) {
      return false;
    }
    this.inputValue = newValue.trim();

    if (this.inputValue === '' || _this.getValueLength(this.inputValue) < 3) {
      this.setState({
        isResultShow: false,
        isResultGetted: false
      });
      return false;
    }
    let queryData = {
      q: newValue,
    };

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(_this.getSearchResult(queryData), 500);
  }

  getSearchResult(queryData) {
    
    this.setState({
      isResultShow: true,
      isResultGetted: false
    });

    this.sendRequest(queryData);
  }

  sendRequest(queryData) { //search dtable
    dtableWebAPI.listWorkspaces().then((res) => {
      let workspaceList = res.data.workspace_list.filter(item => {
        return new Workspace(item);
      });
      let dtableNameList = [];
      workspaceList.forEach(dtable => {
        let resultData = dtable.table_list.filter(item => {
          return item.name.indexOf(queryData.q) > -1;
        });
        if (resultData.length > 0) {
          dtableNameList.push(...resultData);
        }
      });
      this.setState({
        resultItems: dtableNameList,
        isResultGetted: true,
      });
    });
  }

  getValueLength(str) {
    var i = 0, code, len = 0;
    for (; i < str.length; i++) {
      code = str.charCodeAt(i);
      if (code === 10) { //solve enter problem
        len += 2;
      } else if (code < 0x007f) {
        len += 1;
      } else if (code >= 0x0080 && code <= 0x07ff) {
        len += 2;
      } else if (code >= 0x0800 && code <= 0xffff) {
        len += 3;
      }
    }
    return len;
  }

  resetToDefault() {
    this.inputValue = null;
    this.setState({
      width: '',
      value: '',
      isMaskShow: false,
      isCloseShow: false,
      isResultShow: false,
      isResultGetted: false,
      resultItems: [],
      isSearchInputShow: false,
    });
  }

  renderSearchResult() {
    if (!this.state.isResultShow) {
      return;
    }
    if (!this.state.isResultGetted || this.getValueLength(this.inputValue) < 3) {
      return (
        <span className="loading-icon loading-tip"></span>
      );
    }
    if (!this.state.resultItems.length) {
      return (
        <div className="search-result-none">{gettext('No results matching.')}</div>
      );
    }
    return (
      <ul className="search-result-list">
        {this.state.resultItems.map(item => {
          return (
            <SearchResultItem
              key={item.id}
              item={item}
              onItemClickHandler={this.onItemClickHandler}
            />
          );
        })}
      </ul>
    );
  }

  onSearchToggle = () => {
    this.setState({
      isSearchInputShow: !this.state.isSearchInputShow,
      isMaskShow: !this.state.isMaskShow,
    });
  }

  render() {
    let width = this.state.width !== 'default' ? this.state.width : '';
    let style = {'width': width};

    return (
      <Fragment>
        <MediaQuery query="(min-width: 768px)">
          <div className="search">
            <div className={`search-mask ${this.state.isMaskShow ? '' : 'hide'}`} onClick={this.onCloseHandler}></div>
            <div className="search-container">
              <div className="input-icon">
                <i className="search-icon-left input-icon-addon dtable-font dtable-icon-search"></i>
                <input 
                  type="text" 
                  className="form-control search-input" 
                  name="query"
                  placeholder={this.props.placeholder}
                  style={style}
                  value={this.state.value}
                  onFocus={this.onFocusHandler}
                  onChange={this.onChangeHandler}
                  autoComplete="off"
                />
                {this.state.isCloseShow && <i className='search-icon-right input-icon-addon dtable-font dtable-icon-cancel' onClick={this.onCloseHandler}></i>}
              </div>
              <div className="search-result-container">
                {this.renderSearchResult()}
              </div>
            </div>
          </div>
        </MediaQuery>
        <MediaQuery query="(max-width: 767.8px)">
          <div className="search-icon-container">
            <i className="search-icon dtable-font dtable-icon-search" onClick={this.onSearchToggle}></i>
          </div>
          {this.state.isSearchInputShow && 
            <div className="search">
              <div className={`search-mask ${this.state.isMaskShow ? '' : 'hide'}`} onClick={this.onCloseHandler}></div>
              <div className="search-container">
                <div className="input-icon">
                  <input 
                    type="text" 
                    className="form-control search-input" 
                    name="query"
                    placeholder={this.props.placeholder}
                    style={style}
                    value={this.state.value}
                    onFocus={this.onFocusHandler}
                    onChange={this.onChangeHandler}
                    autoComplete="off"
                  />
                  <i className="search-icon-left input-icon-addon dtable-font dtable-icon-search" style={{right: 0}}></i>
                </div>
                <div className="search-result-container">
                  {this.renderSearchResult()}
                </div>
              </div>
            </div>
          }
        </MediaQuery>
      </Fragment>
    );
  }
}

SearchDtable.propTypes = propTypes;

export default SearchDtable;
