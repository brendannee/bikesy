const React = require('react');
import PropTypes from 'prop-types';
const Modal = require('react-modal');

class WelcomeModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Modal
        isOpen={this.props.showWelcomeModal}
        onRequestClose={this.props.hideWelcomeModal}
        contentLabel='Welcome'
      >
        <div className="welcome-modal">
          <img
            src="static/images/bikemapper-logo.png"
            srcset="static/images/bikemapper-logo@2x.png 2x"
            alt="Bike Mapper Logo"
            className="welcome-logo"
          />
          <h1>Welcome to Bike Mapper</h1>
          <ul className="welcome-steps">
            <li>Click anywhere to set the start and end points for your trip</li>
            <li>Drag-and-drop markers to recalculate the route</li>
            <li>Use the address boxes on the left to enter a specific address or landmark</li>
          </ul>
          <button onClick={this.props.hideWelcomeModal} className="btn btn-primary">OK</button>
        </div>
      </Modal>
    );
  }

  componentWillMount() {
    Modal.setAppElement('body');
  }
}

WelcomeModal.propTypes = {
  showWelcomeModal: PropTypes.bool.isRequired,
  hideWelcomeModal: PropTypes.func.isRequired
};

export default WelcomeModal;
