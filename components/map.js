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
    drawMap(this.handleMapClick, this.handleMarkerDrag);
  }

  static getDerivedStateFromProps(nextProps) {
    updateStartMarker(nextProps.startLocation);
    updateEndMarker(nextProps.endLocation);
    updatePath(nextProps.path);

    return null;
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
        <div className="map-logo">
          <img
            src="images/bikemapper-logo.png"
            srcSet="images/bikemapper-logo@2x.png 2x"
            alt="Bike Mapper Logo"
            className="map-logo-image"
          />
          <h1>Bike Mapper</h1>
        </div>
        <div className="map" id="map" style={{ height: `${this.props.height}px` }}></div>
        { this.state.legendVisible ? (
          <div className="map-layers d-print-none">
            <div
              className="close-box"
              onClick={this.toggleLegendVisibility}
            >&minus;</div>
            <div>
              <div className="map-legend-item" title="paved, separated (off the street) bikeways">
                <div className="map-legend-icon class1"></div>
                <label>Multi-use Path</label>
              </div>
              <div className="map-legend-item" title="dedicated on-street bikeways, marked by striping on pavement">
                <div className="map-legend-icon class2"></div>
                <label>Bike Lane</label>
              </div>
              <div className="map-legend-item" title="on-street routes signed for bicyclists">
                <div className="map-legend-icon class3"></div>
                <label>Bike Route</label>
              </div>
              <div className="map-legend-item" title="bike lockers">
                <div className="map-legend-icon bike-lockers"></div>
                <label>
                  <input type="checkbox" value={this.state.bikeLockersVisible} onChange={this.toggleBikeLockerVisibility} /> Bike Lockers
                </label>
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
  path: PropTypes.object,
  startLocation: PropTypes.object,
  endLocation: PropTypes.object,
  setStartLocation: PropTypes.func.isRequired,
  setEndLocation: PropTypes.func.isRequired,
  height: PropTypes.number,
  isMobile: PropTypes.bool,
  mobileView: PropTypes.string,
};

export default Map;
