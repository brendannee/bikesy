import React, { useEffect, useState } from 'react';
import Head from 'next/head';
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
import { handleError } from 'lib/error';
import { reverseGeocode } from 'lib/geocode';
import { latlngIsWithinBounds, updateMapSize, getPathDistance } from 'lib/map';
import { updateUrlParams, readUrlParams, validateUrlParams } from 'lib/url';

import {
  clearPath,
  setScenario,
  setStartLocation,
  setStartAddress,
  setEndLocation,
  setEndAddress,
  setPath,
  setDistance,
  setDirections,
  setElevationProfile,
} from '@redux/slices/search';

import appConfig from 'appConfig';
import { formatLatLngForUrl, parseLatLngFromUrlParameter } from '../lib/url';

const ELEVATION_HEIGHT = 175;

const IndexPage = () => {
  const dispatch = useDispatch();
  const scenario = useSelector((state) => state.search.scenario);
  const startAddress = useSelector((state) => state.search.startAddress);
  const endAddress = useSelector((state) => state.search.endAddress);
  const startLocation = useSelector((state) => state.search.startLocation);
  const endLocation = useSelector((state) => state.search.endLocation);
  const elevationProfile = useSelector((state) => state.search.elevationProfile);

  const [loading, setLoading] = useState(false);
  const [mobileView, setMobileView] = useState('map');
  // window width is not known until after the component mounts
  const [isMobile, setIsMobile] = useState(undefined);
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

  const updateRoute = async ({
    startAddress,
    startLocation,
    endAddress,
    endLocation,
  }) => {
    dispatch(clearPath());
    setLoading(true);
    setShowWelcomeModal(false);

    if (!latlngIsWithinBounds(startLocation, 'start')) {
      setLoading(false);
      return;
    }

    if (!latlngIsWithinBounds(endLocation, 'end')) {
      setLoading(false);
      return;
    }
    dispatch(setStartAddress(startAddress));
    dispatch(setStartLocation(startLocation));
    dispatch(setEndAddress(endAddress));
    dispatch(setEndLocation(endLocation));
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
    if (items.startLocation) {
      assignStartLocation(items.startLocation);
    }
    if (items.endLocation) {
      assignEndLocation(items.endLocation);
    }
    if (items.scenario) {
      dispatch(setScenario(items.scenario));
    }
    if (items.startAddress !== undefined) {
      dispatch(setStartAddress(items.startAddress));
    }
    if (items.endAddress !== undefined) {
      dispatch(setEndAddress(items.endAddress));
    }
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
  const sidebarWidth = 340;
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
    //On page load, read in URL paramaters and route based on these
    const urlParameters = readUrlParams();

    if (validateUrlParams(urlParameters)) {
      dispatch(setScenario(urlParameters[4]));

      updateRoute({
        startAddress: urlParameters[0],
        startLocation: parseLatLngFromUrlParameter(urlParameters[1]),
        endAddress: urlParameters[2],
        endLocation: parseLatLngFromUrlParameter(urlParameters[3]),
      });
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
    if (startLocation && endLocation) {
      fetchRoute();
    }
  }, [startLocation, endLocation, scenario]);

  useEffect(() => {
    if (startAddress && startLocation && endAddress && endLocation) {
      updateUrlParams([
        startAddress,
        formatLatLngForUrl(startLocation),
        endAddress,
        formatLatLngForUrl(endLocation),
        scenario,
      ]);
    }
  }, [startAddress, startLocation, endAddress, endLocation, scenario]);

  return (
    <>
      <Head>
        <title>{appConfig.PAGE_TITLE}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
          key="viewport"
        />
        <meta
          name="description"
          content="Avoid hills and find bike routes with Bikesy.com, an innovative and open-source bike mapping system specially designed to find flat, safe, and fast bike routes anywhere in the San Francisco Bay Area. San Francisco isn’t New York – they might have taller buildings, but we’ve got bigger hills. Since we couldn’t find another service that lets you choose slightly longer but less steep routes, we made our own. Even better, Bikesy automatically gives you an elevation profile for your ride to help you prepare for the tough parts."
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          href="favicon/favicon-32x32.png"
          sizes="32x32"
        />
        <link
          rel="icon"
          type="image/png"
          href="favicon/favicon-16x16.png"
          sizes="16x16"
        />
        <link rel="mask-icon" href="favicon/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
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

        <Directions
          height={directionsHeight}
          isMobile={isMobile}
          mobileView={mobileView}
        />

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
    </>
  );
};

export default IndexPage;
