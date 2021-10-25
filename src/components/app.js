/* global window, alert */

import React, { useEffect, useState } from 'react';
import polyline from '@mapbox/polyline';

import Controls from 'components/controls';
import Directions from 'components/directions';
import Elevation from 'components/elevation';
import Map from 'components/map';
import TitleBar from 'components/titlebar';
import WelcomeModal from 'components/welcome_modal';

import { getRoute } from 'lib/api';
import { logQuery } from 'lib/analytics';
import { handleError } from 'lib/error';
import { geocode, reverseGeocode } from 'lib/geocode';
import { latlngIsWithinBounds, updateMapSize, getPathDistance } from 'lib/map';
import { updateUrlParams, readUrlParams, validateUrlParams } from 'lib/url';

import appConfig from 'appConfig';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('5');
  const [mobileView, setMobileView] = useState('map');
  const [isMobile, setIsMobile] = useState();
  const [elevationHeight, setElevationHeight] = useState(175);
  const [showWelcomeModal, setShowWelcomeModal] = useState(
    appConfig.SHOULD_SHOW_WELCOME_MODAL
  );
  const [startLocation, setStartLocation] = useState();
  const [endLocation, setEndLocation] = useState();
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });
  const [path, setPath] = useState();
  const [distance, setDistance] = useState();
  const [directions, setDirections] = useState();
  const [elevationProfile, setElevationProfile] = useState();
  const [elevationVisible, setElevationVisible] = useState();

  const handleResize = () => {
    setWindowSize({
      height: window.innerHeight,
      width: window.innerWidth,
    });

    setIsMobile(checkMobile(window.innerWidth));
  };

  const updateRoute = async (selectedStartAddress, selectedEndAddress) => {
    clearPath();
    setLoading(true);
    setShowWelcomeModal(false);

    const results = await Promise.all([
      geocode(selectedStartAddress).catch(() => {
        setLoading(false);
        alert('Invalid start address. Please try a different address.');
      }),
      geocode(selectedEndAddress).catch(() => {
        setLoading(false);
        alert('Invalid end address. Please try a different address.');
      }),
    ]);

    if (!results || !results[0] || !results[1]) {
      setLoading(false);
      return;
    }

    if (!latlngIsWithinBounds(results[0], 'start')) {
      setLoading(false);
      return;
    }

    if (!latlngIsWithinBounds(results[1], 'end')) {
      setLoading(false);
      return;
    }

    setStartLocation(results[0]);
    setEndLocation(results[1]);
    setMobileView('map');
  };

  const fetchRoute = async () => {
    setLoading(true);

    try {
      const results = await getRoute(startLocation, endLocation, scenario);

      setLoading(false);

      if (!results.path || !results.path.length) {
        handleError(new Error('No path received'));
        return;
      }

      const geoJSONPath = polyline.toGeoJSON(results.path[0]);
      setPath(geoJSONPath);
      setDistance(getPathDistance(geoJSONPath));
      setDirections(results.directions);
      setElevationProfile(
        results.elevation_profile.map((node) => {
          return {
            distance: node[0],
            elevation: node[1],
          };
        })
      );

      logQuery(startAddress, endAddress, startLocation, endLocation);
    } catch (error) {
      handleError(error);
    }
  };

  const assignStartLocation = (latlng) => {
    clearPath();
    setStartLocation(latlng);
    setStartAddress('');

    reverseGeocode(latlng).then((address) => {
      if (!address) {
        return handleError(new Error('Unable to get reverse geocoding result.'));
      }

      setStartAddress(address);
    });
  };

  const assignEndLocation = (latlng) => {
    clearPath();
    setEndLocation(latlng);
    setEndAddress('');

    reverseGeocode(latlng).then((address) => {
      if (!address) {
        return handleError('Unable to get reverse geocoding result.');
      }

      setEndAddress(address);
    });
  };

  const updateControls = (items) => {
    if (items.startLocation) {
      assignStartLocation(items.startLocation);
    }

    if (items.scenario) {
      setScenario(items.scenario);
    }

    if (items.startAddress !== undefined) {
      setStartAddress(items.startAddress);
    }

    if (items.endAddress !== undefined) {
      setEndAddress(items.endAddress);
    }
  };

  const clearRoute = () => {
    clearPath();
    clearMarkers();
  };

  const toggleElevationVisibility = () => {
    setElevationVisible(!elevationVisible);
    updateMapSize();
  };

  const changeMobileView = (mobileView) => {
    setMobileView(mobileView);

    if (mobileView === 'map') {
      updateMapSize();
    }
  };

  const hideWelcomeModal = (event) => {
    event.preventDefault();
    setShowWelcomeModal(false);
  };

  const clearPath = () => {
    setPath(undefined);
    setDirections(undefined);
    setElevationProfile(undefined);
  };

  const clearMarkers = () => {
    setStartLocation(undefined);
    setEndLocation(undefined);
    setStartAddress(undefined);
    setEndAddress(undefined);
  };

  const checkMobile = (width) => {
    if (width === undefined) {
      return false;
    }

    const mobileBreakpoint = 667;
    return width <= mobileBreakpoint;
  };

  const controlsHeight = 252;
  const sidebarWidth = 300;
  const titlebarHeight = 38;
  let elevationWidth;
  let directionsHeight;
  let mapHeight = windowSize.height;

  if (isMobile) {
    elevationWidth = windowSize.width;
  } else {
    elevationWidth = windowSize.width - sidebarWidth;
    directionsHeight = windowSize.height - controlsHeight;
  }

  if (elevationVisible && elevationProfile) {
    mapHeight -= elevationHeight;
  }

  if (isMobile) {
    mapHeight -= titlebarHeight;
  }

  useEffect(() => {
    const urlParameters = readUrlParams();

    if (validateUrlParams(urlParameters)) {
      setStartAddress(urlParameters[0]);
      setEndAddress(urlParameters[1]);
      setScenario(urlParameters[2]);

      updateRoute(urlParameters[0], urlParameters[1]);
    }

    if (typeof window !== 'undefined') {
      const isMobileCalc = checkMobile(window.innerWidth);

      setWindowSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
      setIsMobile(isMobileCalc);
      setElevationVisible(!isMobileCalc);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  useEffect(() => {
    if (startLocation && endLocation) {
      fetchRoute();
    }
  }, [startLocation, endLocation]);

  useEffect(() => {
    if (startAddress && endAddress) {
      updateUrlParams([startAddress, endAddress, scenario]);
    }
  }, [startAddress, endAddress, scenario]);

  return (
    <div>
      <TitleBar
        changeMobileView={changeMobileView}
        isMobile={isMobile}
        mobileView={mobileView}
      />
      <Controls
        updateRoute={updateRoute}
        clearRoute={clearRoute}
        startAddress={startAddress}
        endAddress={endAddress}
        scenario={scenario}
        loading={loading}
        isMobile={isMobile}
        mobileView={mobileView}
        updateControls={updateControls}
      />
      <Directions
        directions={directions}
        distance={distance}
        startLocation={startLocation}
        endLocation={endLocation}
        startAddress={startAddress}
        endAddress={endAddress}
        elevationProfile={elevationProfile}
        height={directionsHeight}
        isMobile={isMobile}
        mobileView={mobileView}
      />
      <Map
        startLocation={startLocation}
        endLocation={endLocation}
        path={path}
        assignStartLocation={assignStartLocation}
        assignEndLocation={assignEndLocation}
        height={mapHeight}
        isMobile={isMobile}
        mobileView={mobileView}
      />
      <Elevation
        elevationProfile={elevationProfile}
        width={elevationWidth}
        height={elevationHeight}
        toggleElevationVisibility={toggleElevationVisibility}
        elevationVisible={elevationVisible && Boolean(elevationProfile)}
        isMobile={isMobile}
        mobileView={mobileView}
      />
      <WelcomeModal
        showWelcomeModal={showWelcomeModal}
        hideWelcomeModal={hideWelcomeModal}
      />
    </div>
  );
};

export default App;
