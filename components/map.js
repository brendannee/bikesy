const React = require('react');
import PropTypes from 'prop-types';

import {latlngIsWithinBounds, drawMap, updateStartMarker, updateEndMarker, updatePath, updateMapSize} from '../lib/map';
const config = require('../frontendconfig.json');

class Map extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.handleMapClick = (latlng) => {
      if (!this.props.startLocation) {
        if (latlngIsWithinBounds(latlng)) {
          this.props.setStartLocation(latlng);
        }
      } else if (!this.props.endLocation) {
        if (latlngIsWithinBounds(latlng)) {
          this.props.setEndLocation(latlng);
        }
      }
    };

    this.handleMarkerDrag = (latlng, type) => {
      if (latlngIsWithinBounds(latlng)) {
        if (type === 'start') {
          this.props.setStartLocation(latlng);
        } else if (type === 'end') {
          this.props.setEndLocation(latlng);
        }
      }
    };
  }

  componentDidMount() {
    const point = [config.initialCenterLat, config.initialCenterLng];
    const draggable = !this.props.isMobile;
    drawMap(point, config.initialZoom, config.minZoom, draggable, this.handleMapClick, this.handleMarkerDrag);
  }

  componentWillReceiveProps(nextProps) {
    updateStartMarker(nextProps.startLocation);
    updateEndMarker(nextProps.endLocation);
    updatePath(nextProps.decodedPath);
  }

  componentDidUpdate() {
    updateMapSize();
  }

  render() {
    return (
      <div
        className="map-container"
        hidden={this.props.isMobile && this.props.mobileView !== 'map'}
      >
        <div className="logo">
          <img src="static/images/511cc-bike-mapper-logo.png" alt="logo" />
        </div>
        <div className="map" id="map" style={{ height: `${this.props.height}px` }}></div>
      </div>
    );
  }
}

Map.propTypes = {
  startLocation: PropTypes.object,
  endLocation: PropTypes.object,
  setStartLocation: PropTypes.func.isRequired,
  setEndLocation: PropTypes.func.isRequired,
  height: PropTypes.number,
  isMobile: PropTypes.bool,
  mobileView: PropTypes.string,
};

export default Map;
