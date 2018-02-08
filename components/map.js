const React = require('react');
import PropTypes from 'prop-types';

import {latlngIsWithinBounds, drawMap, updateStartMarker, updateEndMarker, updatePath, updateMapSize, toggleBikeLockerLayer} from '../lib/map';
const config = require('../frontendconfig.json');

class Map extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      legendVisible: !this.props.isMobile,
      bikeLockersVisible: false
    };

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

    this.toggleLegendVisibility = () => {
      this.setState({
        legendVisible: !this.state.legendVisible,
      });
    };

    this.toggleBikeLockerVisibility = ()=> {
      this.setState({
        bikeLockersVisible: !this.state.bikeLockersVisible,
      }, () => {
        toggleBikeLockerLayer(this.state.bikeLockersVisible);
      });
    }
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
        { this.state.legendVisible ? (
          <div className="map-layers d-print-none">
            <div
              className="close-box"
              onClick={this.toggleLegendVisibility}
            >&minus;</div>
            <div>
              <div title="bike lockers">
                <div className="map-layer-legend bike-lockers"></div>
                <label><input type="checkbox" value={this.state.bikeLockersVisible} onChange={this.toggleBikeLockerVisibility} /> Bike Lockers</label>
              </div>
              <div title="paved, separated (off the street) bikeways">
                <div className="map-layer-legend class1"></div>
                <span>Multi-use Path</span>
              </div>
              <div title="dedicated on-street bikeways, marked by striping on pavement">
                <div className="map-layer-legend class2"></div>
                <span>Bike Lane</span>
              </div>
              <div title="on-street routes signed for bicyclists">
                <div className="map-layer-legend class3"></div>
                <span>Bike Route</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="map-layers-open-box"
            onClick={this.toggleLegendVisibility}
          >Toggle Map Legend</div>
        )}
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
