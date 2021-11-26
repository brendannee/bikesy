/* global window, alert */

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import polyline from '@mapbox/polyline';
import { useSelector } from 'react-redux';

import Controls from 'components/Controls';
import Directions from 'components/Directions';
import Elevation from 'components/Elevation';
import Map from 'components/Map';
import TitleBar from 'components/Titlebar';
import WelcomeModal from 'components/WelcomeModal';

import { getRoute } from 'lib/api';
import { logQuery } from 'lib/analytics';
import { handleError } from 'lib/error';
import { geocode, reverseGeocode } from 'lib/geocode';
import { latlngIsWithinBounds, updateMapSize, getPathDistance } from 'lib/map';
import { updateUrlParams, readUrlParams, validateUrlParams } from 'lib/url';

import {
  clearPath,
  setStartLocation,
  setStartAddress,
  setEndLocation,
  setEndAddress,
  setPath,
  setDistance
} from '@redux/slices/search';

import appConfig from 'appConfig';

const ELEVATION_HEIGHT = 175;

const App = () => {
  const dispatch = useDispatch();
  const startAddress = useSelector((state) => state.search.startAddress);
  const endAddress = useSelector((state) => state.search.endAddress);
  const startLocation = useSelector((state) => state.search.startLocation);
  const endLocation = useSelector((state) => state.search.endLocation);
  const elevationProfile = useSelector((state) => state.search.elevationProfile);

  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('5');
  const [mobileView, setMobileView] = useState('map');
  const [isMobile, setIsMobile] = useState();
  const [showWelcomeModal, setShowWelcomeModal] = useState(
    appConfig.SHOULD_SHOW_WELCOME_MODAL
  );

  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  const [elevationVisible, setElevationVisible] = useState(false);

  const handleResize = () => {
    setWindowSize({
      height: window.innerHeight,
      width: window.innerWidth,
    });

    setIsMobile(checkMobile(window.innerWidth));
  };

  const updateRoute = async (selectedStartAddress, selectedEndAddress) => {
    dispatch(clearPath());
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

    dispatch(setStartLocation(results[0]));
    dispatch(setEndLocation(results[1]));
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

      dispatch(setPath(geoJSONPath));
      dispatch(setDistance(getPathDistance(geoJSONPath)));
      dispatch(setDirections(results.directions));
      dispatch(
        setElevationProfile(
          results.elevation_profile.map((node) => {
            return {
              distance: node[0],
              elevation: node[1],
            };
          })
        )
      );

      logQuery(startAddress, endAddress, startLocation, endLocation);
    } catch (error) {
      handleError(error);
    }
  };

  const assignStartLocation = (latlng) => {
    dispatch(clearPath());
    dispatch(setStartLocation(latlng));
    dispatch(setStartAddress(''));

    reverseGeocode(latlng).then((address) => {
      if (!address)
        return handleError(new Error('Unable to get reverse geocoding result.'));

      dispatch(setStartAddress(address));
    });
  };

  const assignEndLocation = (latlng) => {
    dispatch(clearPath());
    dispatch(setEndLocation(latlng));
    dispatch(setEndAddress(''));

    reverseGeocode(latlng).then((address) => {
      if (!address) {
        return handleError('Unable to get reverse geocoding result.');
      }

      dispatch(setEndAddress(address));
    });
  };

  const updateControls = (items) => {
    if (items.startLocation) assignStartLocation(items.startLocation);
    if (items.scenario) setScenario(items.scenario);
    if (items.startAddress !== undefined) dispatch(setStartAddress(items.startAddress));
    if (items.endAddress !== undefined) dispatch(setEndAddress(items.endAddress));
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

  const checkMobile = (width) => {
    if (width === undefined) return false;

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
    mapHeight -= ELEVATION_HEIGHT;
  }

  if (isMobile) {
    mapHeight -= titlebarHeight;
  }

  useEffect(() => {
    const urlParameters = readUrlParams();

    if (validateUrlParams(urlParameters)) {
      dispatch(setStartAddress(urlParameters[0]));
      dispatch(setEndAddress(urlParameters[1]));
      setScenario(urlParameters[2]);

      updateRoute(urlParameters[0], urlParameters[1]);
    }

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
  }, []);

  useEffect(() => {
    if (startLocation && endLocation) fetchRoute();
  }, [startLocation, endLocation]);

  useEffect(() => {
    if (startAddress && endAddress) updateUrlParams([startAddress, endAddress, scenario]);
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
        scenario={scenario}
        loading={loading}
        isMobile={isMobile}
        mobileView={mobileView}
        updateControls={updateControls}
      />

      <Directions height={directionsHeight} isMobile={isMobile} mobileView={mobileView} />

      <Map
        assignStartLocation={assignStartLocation}
        assignEndLocation={assignEndLocation}
        height={mapHeight}
        isMobile={isMobile}
        mobileView={mobileView}
      />

      <Elevation
        width={elevationWidth}
        height={ELEVATION_HEIGHT}
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
