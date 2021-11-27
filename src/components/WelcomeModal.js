import Modal from 'react-modal';
import appConfig from 'appConfig';

Modal.setAppElement('body');

const WelcomeModal = ({ showWelcomeModal, hideWelcomeModal }) => {
  return (
    <Modal
      isOpen={showWelcomeModal}
      onRequestClose={hideWelcomeModal}
      contentLabel="Welcome"
    >
      <div className="welcome-modal">
        <h1>{appConfig.WELCOME_MODAL_TITLE}</h1>
        <ul>
          <li>Click anywhere to set the start and end points for your trip</li>
          <li>Drag-and-drop markers to recalculate the route</li>
          <li>
            Use the address boxes on the left to enter a specific address or landmark
          </li>
        </ul>
        <button onClick={hideWelcomeModal} className="btn btn-primary">
          OK
        </button>
      </div>
    </Modal>
  );
};

export default WelcomeModal;
