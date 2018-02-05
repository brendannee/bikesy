const React = require('react');
import PropTypes from 'prop-types';
const classNames = require('classnames');

import {formatDistance, formatTime, formatElevation, getElevationGain} from '../lib/helper';
import {getPathDistance} from '../lib/map';

class Directions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  getDistance() {
    return getPathDistance(this.props.decodedPath);
  }

  getDirections() {
    if (!this.props.directions) {
      return '';
    }

    const directionsList = this.props.directions.reduce((memo, direction, idx) => {
      if (direction[1] !== 'nameless') {
        memo.push(<li key={idx}><b>{direction[0]}</b> on <b>{direction[1]}</b></li>);
      }
      return memo;
    }, []);

    directionsList.push((
      <li key="final"><b>arrive</b> at <b>{this.props.endAddress}</b></li>
    ));

    const totalDistance = this.getDistance();

    return (
      <div>
        <h3>Directions to {this.props.endAddress}</h3>
        <div className="stats">
          <div className="stat">
            Distance: {formatDistance(totalDistance)}
          </div>
          <div className="stat">
            Time: {formatTime(totalDistance)}
          </div>
          <div className="stat">
            Total Feet of Climbing: {formatElevation(getElevationGain(this.props.elevationProfile))}
          </div>
        </div>
        <ul className="directions-list">
          {directionsList}
        </ul>
        <a href="#" className="hidden-print" onClick={window.print}><small>Print this map to view your route offline.</small></a>
      </div>
    )
  }

  getDisclaimer() {
    return (
      <div className="disclaimer">
        We offer no guarantee regarding roadway conditions or safety of the proposed routes. Use your best judgment when choosing a route. Obey all vehicle code provisions.
      </div>
    )
  }

  render() {
    const height = this.props.height ? `${this.props.height}px` : 'auto';

    return (
      <div
        className="directions"
        hidden={this.props.isMobile && this.props.mobileView !== 'directions'}
        style={{ height }}
      >
        {this.getDirections()}
        {this.getDisclaimer()}
      </div>
    );
  }
}

Directions.propTypes = {
  directions: PropTypes.array,
  endAddress: PropTypes.string,
  decodedPath: PropTypes.array,
  elevationProfile: PropTypes.array,
  height: PropTypes.number,
  isMobile: PropTypes.bool,
  mobileView: PropTypes.string,
};

export default Directions;
