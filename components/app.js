const React = require('react');
import NoSSR from 'react-no-ssr'
const polyline = require('@mapbox/polyline');
import 'whatwg-fetch';

import Controls from './controls'
import Directions from './directions'
import Elevation from './elevation'
import Map from './map'
import TitleBar from './titlebar'
import WelcomeModal from './welcome_modal'

import {getRoute} from '../lib/api';
import {logQuery} from '../lib/analytics';
import {handleError} from '../lib/error';
import {geocode, reverseGeocode} from '../lib/geocode';
import {latlngIsWithinBounds, updateMapSize} from '../lib/map';
import {updateUrlParams, readUrlParams, validateUrlParams} from '../lib/url';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scenario: '1',
      mobileView: 'map'
    };

    this.handleResize = () => {
      this.setState({
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth,
        isMobile: this.isMobile(window.innerWidth),
      });
    };

    this.updateRoute = (startAddress, endAddress, scenario) => {
      this.clearPath();
      this.setState({
        startAddress,
        endAddress,
        scenario,
        loading: true,
      });
      const promises = [
        geocode(startAddress).catch(() => {
          this.setState({ loading: false });
          alert('Invalid start address. Please try a different address.');
        }),
        geocode(endAddress).catch(() => {
          this.setState({ loading: false });
          alert('Invalid end address. Please try a different address.');
        }),
      ];
      Promise.all(promises)
      .then((results) => {
        if (!results || !results[0] || !results[1]) {
          this.setState({ loading: false });
          return;
        }

        if (!latlngIsWithinBounds(results[0], 'start')) {
          this.setState({ loading: false });
          return;
        }

        if (!latlngIsWithinBounds(results[1], 'end')) {
          this.setState({ loading: false });
          return;
        }

        this.setState({
          startLocation: results[0],
          endLocation: results[1],
          mobileView: 'map',
        });

        this.fetchRoute();
      });
    };

    this.fetchRoute = () => {
      this.setState({ loading: true });
      getRoute(this.state.startLocation, this.state.endLocation, this.state.scenario)
      .then((results) => {
        this.setState({ loading: false });
        if (!results.path || !results.path.length) {
          handleError(new Error('No path recieved'));
          return;
        }

        this.setState({
          decodedPath: polyline.decode(results.path[0]),
          directions: results.directions,
          elevationProfile: results.elevation_profile
        });
        updateUrlParams([this.state.startAddress, this.state.endAddress, this.state.scenario]);
        logQuery(this.state.startAddress, this.state.endAddress, this.state.startLocation, this.state.endLocation);
      })
      .catch(handleError);
    };

    this.setStartLocation = (latlng) => {
      this.clearPath();
      this.setState({
        startLocation: latlng,
        startAddress: undefined,
      });

      if (this.state.endLocation) {
        this.fetchRoute();
      }

      reverseGeocode(latlng).then((address) => {
        if (!address) {
          handleError(new Error('Unable to get reverse geocoding result.'));
          return;
        }

        return this.setState({
          startAddress: address,
        });
      });
    };

    this.setEndLocation = (latlng) => {
      this.clearPath();
      this.setState({
        endLocation: latlng,
        endAddress: undefined,
      });

      if (this.state.startLocation) {
        this.fetchRoute();
      }

      reverseGeocode(latlng).then((address) => {
        if (!address) {
          return handleError('Unable to get reverse geocoding result.');
        }

        return this.setState({
          endAddress: address,
        });
      });
    };

    this.updateDistance = (totalDistance) => {
      this.setState({
        totalDistance,
      });
    };

    this.clearRoute = () => {
      this.clearPath();
      this.clearMarkers();
    };

    this.toggleElevationVisibility = () => {
      this.setState({
        elevationVisible: !this.state.elevationVisible,
      }, () => {
        updateMapSize();
      });
    };

    this.changeMobileView = (mobileView) => {
      this.setState({
        mobileView,
      }, () => {
        if (this.state.mobileView === 'map') {
          updateMapSize();
        }
      });
    };
  }

  componentDidMount() {
    const isMobile = this.isMobile(window.innerWidth);

    this.setState({
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      isMobile,
      elevationVisible: !isMobile
    });

    window.addEventListener('resize', this.handleResize);
    const urlParams = readUrlParams();

    if (validateUrlParams(urlParams)) {
      this.updateRoute(urlParams[0], urlParams[1], urlParams[2]);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  clearPath() {
    this.setState({
      decodedPath: undefined,
      directions: undefined,
      elevationProfile: undefined,
    });
  }

  clearMarkers() {
    this.setState({
      startLocation: undefined,
      endLocation: undefined,
      startAddress: undefined,
      endAddress: undefined,
    });
  }

  getElevationHeight() {
    const elevationHeight = 175;
    return elevationHeight;
  }

  getMapHeight() {
    let elevationHeight = this.getElevationHeight();
    let titlebarHeight;

    if (this.state.isMobile) {
      titlebarHeight = 38;
    } else {
      titlebarHeight = 0;
    }

    if (!this.state.elevationVisible || !this.state.elevationProfile) {
      elevationHeight = 0;
    }

    return this.state.windowHeight - elevationHeight - titlebarHeight;
  }

  isMobile(width) {
    if (width === undefined) {
      return false;
    }
    const mobileBreakpoint = 667;
    return width <= mobileBreakpoint;
  }

  render() {
    const controlsHeight = 252;
    const sidebarWidth = 300;
    let elevationWidth;
    let directionsHeight;

    if (this.state.isMobile) {
      elevationWidth = this.state.windowWidth;
    } else {
      elevationWidth = this.state.windowWidth - sidebarWidth;
      directionsHeight = this.state.windowHeight - controlsHeight;
    }

    return (
      <div>
        <TitleBar
          changeMobileView={this.changeMobileView}
          isMobile={this.state.isMobile}
          mobileView={this.state.mobileView}
        />
        <Controls
          updateRoute={this.updateRoute}
          clearRoute={this.clearRoute}
          startAddress={this.state.startAddress}
          endAddress={this.state.endAddress}
          scenario={this.state.scenario}
          loading={this.state.loading}
          isMobile={this.state.isMobile}
          mobileView={this.state.mobileView}
        />
        <Directions
          directions={this.state.directions}
          decodedPath={this.state.decodedPath}
          endAddress={this.state.endAddress}
          elevationProfile={this.state.elevationProfile}
          height={directionsHeight}
          isMobile={this.state.isMobile}
          mobileView={this.state.mobileView}
        />
        <Map
          startLocation={this.state.startLocation}
          endLocation={this.state.endLocation}
          decodedPath={this.state.decodedPath}
          setStartLocation={this.setStartLocation}
          setEndLocation={this.setEndLocation}
          height={this.getMapHeight()}
          isMobile={this.state.isMobile}
          mobileView={this.state.mobileView}
        />
        <Elevation
          elevationProfile={this.state.elevationProfile}
          width={elevationWidth}
          height={this.getElevationHeight()}
          toggleElevationVisibility={this.toggleElevationVisibility}
          elevationVisible={this.state.elevationVisible && !!this.state.elevationProfile}
          isMobile={this.state.isMobile}
          mobileView={this.state.mobileView}
        />
        <NoSSR>
          <WelcomeModal />
        </NoSSR>
      </div>
    );
  }
}

export default App;
