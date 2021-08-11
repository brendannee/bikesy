import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faListAlt } from '@fortawesome/free-solid-svg-icons';

const TitleBar = ({ mobileView, changeMobileView }) => {
  const getRightButton = () => {
    if (mobileView === 'map') {
      return (
        <button
          className="btn btn-white btn-sm btn-right d-print-none pt-0"
          onClick={() => changeMobileView('directions')}
        >
          <FontAwesomeIcon icon={faListAlt} /> Directions
        </button>
      );
    }

    if (mobileView === 'directions') {
      return (
        <button
          className="btn btn-white btn-sm btn-right d-print-none pt-0"
          onClick={() => changeMobileView('map')}
        >
          <FontAwesomeIcon icon={faMap} /> Map
        </button>
      );
    }

    return null;
  };

  return (
    <div className="titlebar">
      <h1 className="site-title">
        <img
          src="/images/bikesy-logo.png"
          srcSet="/images/bikesy-logo@2x.png 2x"
          alt="logo"
          className="logo"
        />
      </h1>
      {getRightButton()}
    </div>
  );
};

export default TitleBar;
