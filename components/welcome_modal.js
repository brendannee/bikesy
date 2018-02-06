const React = require('react');
const Modal = require('react-modal');

class WelcomeModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalOpen: true
    };

    this.hideWelcomeModal = (e) => {
      e.preventDefault();
      this.setState({
        modalOpen: false,
      });
    };
  }

  render() {
    return (
      <Modal
        isOpen={this.state.modalOpen}
        onRequestClose={this.hideWelcomeModal}
        contentLabel='Welcome'
      >
        <h1>Welcome to Bikesy</h1>
        <ul>
          <li>Click anywhere to set the start and end points for your trip</li>
          <li>Drag-and-drop markers to recalculate the route</li>
          <li>Use the address boxes on the left to enter a specific address or landmark</li>
        </ul>
        <button onClick={this.hideWelcomeModal} className="btn btn-primary">OK</button>
      </Modal>
    );
  }

  componentWillMount() {
    Modal.setAppElement('body');
  }
}

export default WelcomeModal;
