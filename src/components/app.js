import React, { useContext, useEffect, useState } from 'react';
import polyline from '@mapbox/polyline';

import Elevation from 'components/Elevation';
import Map from 'components/Map';
import Sidebar from 'components/Sidebar';
import WelcomeModal from 'components/WelcomeModal';

import { getRoute } from 'lib/api';
import { logQuery } from 'lib/analytics';
import { handleError } from 'lib/error';
import { geocode, reverseGeocode } from 'lib/geocode';
import { latlngIsWithinBounds, updateMapSize, getPathDistance } from 'lib/map';
import { updateUrlParams, readUrlParams, validateUrlParams } from 'lib/url';

const SHOULD_SHOW_WELCOME_MODAL_DEFAULT =
  process.env.NEXT_PUBLIC_SHOULD_SHOW_WELCOME_MODAL != 'false';

const App = () => {
  // const hideWelcomeModal = (event) => {
  //   event.preventDefault();
  //   setShowWelcomeModal(false);
  // };

  // useEffect(() => {
  //   const urlParameters = readUrlParams();

  //   if (validateUrlParams(urlParameters)) {
  //     setStartAddress(urlParameters[0]);
  //     setEndAddress(urlParameters[1]);
  //     setScenario(urlParameters[2]);

  //     updateRoute(urlParameters[0], urlParameters[1]);
  //   }
  // }, []);

  // useEffect(() => {
  // if (startLocation && endLocation) fetchRoute();
  // }, [startLocation, endLocation, fetchRoute]);

  // useEffect(() => {
  //   if (startAddress && endAddress) updateUrlParams([startAddress, endAddress, scenario]);
  // }, [startAddress, endAddress, scenario]);

  return (
    <div>
      <Sidebar />
      <Map />
      <Elevation />

      {/* <WelcomeModal
        showWelcomeModal={showWelcomeModal}
        hideWelcomeModal={hideWelcomeModal}
      /> */}
    </div>
  );
};

export default App;

export { DataContext, useData };
