const React = require('react');
const ReactDOM = require('react-dom');
const polyline = require('@mapbox/polyline');
import 'whatwg-fetch';

const Controls = require('./controls.jsx');
const Directions = require('./directions.jsx');
const Disclaimer = require('./disclaimer.jsx');
const Elevation = require('./elevation.jsx');
const Map = require('./map.jsx');
const TitleBar = require('./titlebar.jsx');
const WelcomeModal = require('./welcome_modal.jsx');
const api = require('../js/api');
const analytics = require('../js/analytics');
const error = require('../js/error');
const geocode = require('../js/geocode');
const map = require('../js/map');
const url = require('../js/url');

class App extends React.Component {
  constructor(props) {
    super(props);

    const isMobile = this.isMobile(window.innerWidth);

    this.state = {
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      isMobile,
      elevationVisible: !isMobile,
      scenario: '1',
      mobileView: 'map',
      showDisclaimer: true,
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
        geocode.geocode(startAddress).catch(() => {
          this.setState({ loading: false });
          alert('Invalid start address. Please try a different address.');
        }),
        geocode.geocode(endAddress).catch(() => {
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

        if (!map.latlngIsWithinBounds(results[0], 'start')) {
          this.setState({ loading: false });
          return;
        }

        if (!map.latlngIsWithinBounds(results[1], 'end')) {
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
      api.getRoute(this.state.startLocation, this.state.endLocation, this.state.scenario)
      .then((results) => {
        this.setState({ loading: false });
        if (!results.path || !results.path.length) {
          error.handleError(new Error('No path recieved'));
          return;
        }

        this.setState({
          decodedPath: polyline.decode(results.path[0]),
          directions: results.directions,
          elevationProfile: results.elevation_profile,
          showDisclaimer: false,
        });
        url.updateUrlParams([this.state.startAddress, this.state.endAddress, this.state.scenario]);
        analytics.logQuery(this.state.startAddress, this.state.endAddress, this.state.startLocation, this.state.endLocation);
      })
      .catch(error.handleError);
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

      geocode.reverseGeocode(latlng).then((address) => {
        if (!address) {
          error.handleError(new Error('Unable to get reverse geocoding result.'));
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

      geocode.reverseGeocode(latlng).then((address) => {
        if (!address) {
          return this.handleError('Unable to get reverse geocoding result.');
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
        map.updateMapSize();
      });
    };

    this.changeMobileView = (mobileView) => {
      this.setState({
        mobileView,
      }, () => {
        if (this.state.mobileView === 'map') {
          map.updateMapSize();
        }
      });
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    const urlParams = url.readUrlParams();

    if (url.validateUrlParams(urlParams)) {
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
    const mobileBreakpoint = 667;
    return width <= mobileBreakpoint;
  }

  render() {
    const controlsHeight = 212;
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
          showDisclaimer={this.state.showDisclaimer}
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
        <Disclaimer classes={{ 'visible-print-block': true }} />
        <WelcomeModal />
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);
