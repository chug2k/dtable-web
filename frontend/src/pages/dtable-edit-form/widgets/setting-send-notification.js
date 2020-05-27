import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Label, Input } from 'reactstrap';
import CollaboratorEditorOption from '../../dtable-share-form/cell-editor-widgets/collaborator-editor-option';
import CollaboratorEditorPopover from '../../dtable-share-form/cell-editor-widgets/collaborator-editor-popover';
import '../../dtable-share-form/css/collaborator.css'; 

const gettext = window.gettext;
const propTypes = {
  selectedUsers: PropTypes.array,
  relatedUsers: PropTypes.array,
  onCommit: PropTypes.func,
  closeSendNotification: PropTypes.func,
  openSendNotification: PropTypes.func,
  isSendNotification: PropTypes.bool,
};

class SettingSendNotication extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedUsers: props.selectedUsers,
      showPopover: false,
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

  onCommit = (selectedUsers) => {
    this.props.onCommit(selectedUsers);
  }
  
  togglePopover = (event) => {
    event.nativeEvent.stopImmediatePropagation();
    event.stopPropagation();
    this.setState({showPopover: !this.state.showPopover});
  }

  onDeleteUser = (deletedUser) => {
    let selectedUsers = this.state.selectedUsers.filter(user => user.email !== deletedUser.email);
    this.setState({selectedUsers: selectedUsers}, () => {
      this.onCommit(selectedUsers);
    });
  }

  onOptionItemToggle = (user) => {
    let { selectedUsers: currentValue } = this.state;
    let selectedUsers = currentValue.slice(0);
    let emails = selectedUsers.map(item => {return item.email;});
    let email_index = emails.indexOf(user.email);
    if (email_index > -1) {
      selectedUsers.splice(email_index, 1);
    } else {
      selectedUsers.push(user);
    }
    this.setState({selectedUsers}, () => {
      this.onCommit(selectedUsers);
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
  
  render() {
    let { showPopover, selectedUsers } = this.state;
    const { isSendNotification, closeSendNotification, openSendNotification } = this.props;
    const popoverStyle = this.getPopoverStyle();
    return (
      <div className="table-setting">   
        <div className="title">{gettext('Notification Rule')}</div>
        <FormGroup check className="ml-1">
          <Label check>
            <Input type="radio" name="radio2" onChange={closeSendNotification} checked={!isSendNotification}/>
            {' '}{gettext('Do not send notification')}
          </Label>
        </FormGroup>
        <FormGroup check className="ml-1">
          <Label check>
            <Input type="radio" name="radio2" onChange={openSendNotification} checked={isSendNotification}/>
            {' '}{gettext('Send notification to')}
          </Label>
        </FormGroup>
        {isSendNotification &&
          <div className="mt-2 position-relative">
            <div className="send-notification-container" onClick={this.togglePopover}>
              {selectedUsers.map((user, index) => {
                return (
                  <CollaboratorEditorOption
                    key={index}
                    collaborator={user}
                    onDeleteCollaborator={this.onDeleteUser}
                  />
                );
              })}
            </div>
            {showPopover &&
              <CollaboratorEditorPopover
                popoverStyle={popoverStyle}
                collaborators={this.props.relatedUsers}
                selectedCollaborators={selectedUsers}
                onOptionItemToggle={this.onOptionItemToggle}
              />
            }
          </div>
        }
      </div>
    );
  }
}

SettingSendNotication.propTypes = propTypes;

export default SettingSendNotication;
