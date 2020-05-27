import React, {Fragment} from 'react';
import ReactDOM from 'react-dom';
import MediaQuery from 'react-responsive';
import { siteRoot } from './utils/constants';
import { Modal } from 'reactstrap';
import SidePanel from './pages/dtable/side-panel';
import MainPanel from './pages/dtable/main-panel';
import SystemNotification from './components/system-notification';

import './css/layout.css';
import './css/side-panel.css';
import './css/dtable.css';

class AppDTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      currentTab: 'dtable',
      isSidePanelClosed: true
    };
  }

  componentDidMount() {
    const seletedTabs = ['dtable', 'apps', 'forms', 'templetes', 'activities', 'common-datasets'];
    let currentTab = seletedTabs.find(tab => {
      return location.href.indexOf(`${siteRoot}${tab}`) > -1;
    });
    currentTab = currentTab ? currentTab : 'dtable';
    this.setState({currentTab: currentTab});
  }

  onTabClick = (tab) => {
    if (tab !== this.state.currentTab) {
      this.setState({currentTab: tab});
    }
  }

  toggleSidePanel = () => {
    this.setState({
      isSidePanelClosed: !this.state.isSidePanelClosed
    });
  }

  render() {

    let { isSidePanelClosed } = this.state;
    return (
      <Fragment>
        <SystemNotification />
        <div id="main">
          <SidePanel currentTab={this.state.currentTab} isSidePanelClosed={isSidePanelClosed} onCloseSidePanel={this.toggleSidePanel} onTabClick={this.onTabClick}></SidePanel>
          <MainPanel onShowSidePanel={this.toggleSidePanel}></MainPanel>
          <MediaQuery query="(max-width: 767.8px)">
            <Modal isOpen={!isSidePanelClosed} toggle={this.toggleSidePanel} contentClassName="d-none"></Modal>
          </MediaQuery>
        </div>
      </Fragment>

    );
  }
}

ReactDOM.render(
  <AppDTable />,
  document.getElementById('wrapper')
);
