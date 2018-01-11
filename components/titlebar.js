const React = require('react');
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import {faMap, faListAlt} from '@fortawesome/fontawesome-free-solid'

class TitleBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.showDirections = () => {
      this.props.changeMobileView('directions');
    };

    this.showMap = () => {
      this.props.changeMobileView('map');
    };
  }

  getRightButton() {
    let button = '';
    if (this.props.mobileView === 'map') {
      button = (
        <button
          className="btn btn-white btn-sm btn-right hidden-print pt-0"
          onClick={this.showDirections}
        >
          <FontAwesomeIcon icon={faListAlt} /> Directions
        </button>
      );
    } else if (this.props.mobileView === 'directions') {
      button = (
        <button
          className="btn btn-white btn-sm btn-right hidden-print pt-0"
          onClick={this.showMap}
        >
          <FontAwesomeIcon icon={faMap} /> Map
        </button>
      );
    }
    return button;
  }

  render() {
    return (
      <div className="titlebar">
        <h1 className="site-title">
          <img
            src="/static/images/511cc-bike-mapper-logo.png"
            alt="logo"
            className="logo"
          />
        </h1>
        {this.getRightButton()}
      </div>
    );
  }
}

TitleBar.propTypes = {
  changeMobileView: PropTypes.func.isRequired,
  isMobile: PropTypes.bool,
  mobileView: PropTypes.string.isRequired,
};

export default TitleBar;
