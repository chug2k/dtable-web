import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Label, Input } from 'reactstrap';
import GroupSelectionPopover from './group-selection-popover';
import GroupSelectionItem from './group-selection-item';
import '../css/group-selection.css'; 

const gettext = window.gettext;
const propTypes = {
  handleShareTypeChange: PropTypes.func.isRequired,
  shareType: PropTypes.string.isRequired,
  allGroups: PropTypes.array.isRequired,
  selectedGroups: PropTypes.array.isRequired,
  onCommit: PropTypes.func.isRequired,
};

class SettingFormShare extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      showPopover: false,
      selectedGroups: props.selectedGroups,
    };
  }

  componentDidMount() {
    document.addEventListener('click', this.onDocumentToggle);
  }
  
  componentWillUnmount() {
    document.removeEventListener('click', this.onDocumentToggle);
  }

  onDocumentToggle = () => {
    this.setState({showPopover: false});
  }

  onCommit = (selectedGroups) => {
    this.props.onCommit(selectedGroups);
  }
  
  togglePopover = (event) => {
    event.nativeEvent.stopImmediatePropagation();
    event.stopPropagation();
    this.setState({showPopover: !this.state.showPopover});
  }

  onDeleteGroup = (deletedGroup) => {
    let selectedGroups = this.state.selectedGroups.filter(group => group.id !== deletedGroup.id);
    this.setState({selectedGroups: selectedGroups}, () => {
      this.onCommit(selectedGroups);
    });
  }

  onOptionItemToggle = (group) => {
    let { selectedGroups: currentValue } = this.state;
    let selectedGroups = currentValue.slice(0);
    let group_ids = selectedGroups.map(item => {return item.id;});
    let group_index = group_ids.indexOf(group.id);
    if (group_index > -1) {
      selectedGroups.splice(group_index, 1);
    } else {
      selectedGroups.push(group);
    }
    this.setState({selectedGroups}, () => {
      this.onCommit(selectedGroups);
    });
  }

  getPopoverStyle = () => {
    return {
      width: '250px',
      minHeight: 'auto',
      position: 'absolute',
      margin: '5px',
    };
  }
  
  changeToAnonymous = () => {
    this.props.handleShareTypeChange('anonymous');
  }

  changeToUsers = () => {
    this.props.handleShareTypeChange('login_users');
  }

  changeToGroups = () => {
    this.props.handleShareTypeChange('shared_groups');
  }

  render() {
    let { showPopover } = this.state;
    const { shareType, allGroups, selectedGroups } = this.props;
    const popoverStyle = this.getPopoverStyle();
    return (
      <div className="table-setting">   
        <div className="title">{gettext('Access Permission')}</div>
        <FormGroup check className="ml-1">
          <Label check>
            <Input type="radio" name="formShare" onChange={this.changeToAnonymous} checked={shareType === 'anonymous'}/>
            {' '}{gettext('Anyone (including anonymous users)')}
          </Label>
        </FormGroup>
        <FormGroup check className="ml-1">
          <Label check>
            <Input type="radio" name="formShare" onChange={this.changeToUsers} checked={shareType === 'login_users'}/>
            {' '}{gettext('Only login users')}
          </Label>
        </FormGroup>
        <FormGroup check className="ml-1">
          <Label check>
            <Input type="radio" name="formShare" onChange={this.changeToGroups} checked={shareType === 'shared_groups'}/>
            {' '}{gettext('Specific groups')}
          </Label>
        </FormGroup>
        {shareType === 'shared_groups' &&
          <div className="mt-2 position-relative">
            <div className="send-notification-container" onClick={this.togglePopover}>
              {selectedGroups.map((group, index) => {
                return (
                  <GroupSelectionItem
                    key={index}
                    group={group}
                    onDeleteGroup={this.onDeleteGroup}
                  />
                );
              })}
            </div>
            {showPopover &&
              <GroupSelectionPopover
                popoverStyle={popoverStyle}
                groups={allGroups}
                selectedGroups={selectedGroups}
                onOptionItemToggle={this.onOptionItemToggle}
              />
            }
          </div>
        }
      </div>
    );
  }
}

SettingFormShare.propTypes = propTypes;

export default SettingFormShare;
