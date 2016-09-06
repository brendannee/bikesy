const React = require('react');
const classNames = require('classnames');

const helper = require('../js/helper');
const map = require('../js/map');

const Disclaimer = require('./disclaimer.jsx');

class Directions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  getDistance() {
    return map.getPathDistance(this.props.decodedPath);
  }

  render() {
    if (!this.props.directions || !this.props.directions.length) {
      return <div />;
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
    const height = this.props.height ? `${this.props.height}px` : 'auto';

    return (
      <div
        className={classNames(
          'directions',
          { hide: this.props.isMobile && this.props.mobileView !== 'directions' }
        )}
        style={{ height }}
      >
        <h3>Directions to {this.props.endAddress}</h3>
        <div className="stats">
          <div className="stat">
            Distance: {helper.formatDistance(totalDistance)}
          </div>
          <div className="stat">
            Time: {helper.formatTime(totalDistance)}
          </div>
          <div className="stat">
            Total Feet of Climbing: {helper.formatElevation(helper.getElevationGain(this.props.elevationProfile))}
          </div>
        </div>
        <ul className="directions-list">
          {directionsList}
        </ul>
        <a href="#" className="hidden-print" onClick={window.print}>Print this map to view your route offline.</a>
      </div>
    );
  }
}

Directions.propTypes = {
  directions: React.PropTypes.array,
  endAddress: React.PropTypes.string,
  decodedPath: React.PropTypes.array,
  elevationProfile: React.PropTypes.array,
  height: React.PropTypes.number,
  isMobile: React.PropTypes.bool.isRequired,
  mobileView: React.PropTypes.string,
};

module.exports = Directions;
