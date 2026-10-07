import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import appConfig from '../appConfig';
import { trackEvent } from '../lib/analytics';
import {
  latlngIsWithinBounds,
  drawMap,
  updateStartMarker,
  updateEndMarker,
  updatePath,
  updateMapSize,
} from '../lib/map';
import MapLayers from '../components/MapLayers';

const Map = ({
  isMobile,
  mobileView,
  height,
  assignStartLocation,
  assignEndLocation,
}) => {
  const startLocation = useSelector((state) => state.search.startLocation);
  const endLocation = useSelector((state) => state.search.endLocation);
  const path = useSelector((state) => state.search.path);
  const scenario = useSelector((state) => state.search.scenario);

  const startLocationRef = useRef(startLocation);
  const endLocationRef = useRef(endLocation);
  const scenarioRef = useRef(scenario);

  const mapRef = useRef(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const handleMapClick = (latlng) => {
    if (!startLocationRef.current) {
      if (latlngIsWithinBounds(latlng)) {
        assignStartLocation(latlng);
      }
    } else if (!endLocationRef.current) {
      if (latlngIsWithinBounds(latlng)) {
        assignEndLocation(latlng);
      }
    }
  };

  const handleMarkerDrag = (latlng, type) => {
    if (latlngIsWithinBounds(latlng)) {
      if (type === 'start') {
        assignStartLocation(latlng);
        if (endLocationRef.current) {
          trackEvent('route_submit', { source: 'pin_drag', scenario: scenarioRef.current });
        }
      } else if (type === 'end') {
        assignEndLocation(latlng);
        if (startLocationRef.current) {
          trackEvent('route_submit', { source: 'pin_drag', scenario: scenarioRef.current });
        }
      }
    }
  };

  useEffect(() => {
    setIsMapLoaded(false);
    const map = drawMap(handleMapClick, handleMarkerDrag);
    map.on('load', () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = map;
      setIsMapLoaded(true);
    });
    return () => {
      // TODO it would be nice to remove the map when this component unmounts,
      // But this is leading to problems during fast refresh hot module reloading during development
      // mapRef.current.remove();
    };
  }, []);

  useEffect(() => {
    updateStartMarker(startLocation);
    startLocationRef.current = startLocation;
  }, [startLocation]);

  useEffect(() => {
    updateEndMarker(endLocation);
    endLocationRef.current = endLocation;
  }, [endLocation]);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    updatePath(path);
  }, [path]);

  useEffect(() => {
    updateMapSize();
  }, [height]);

  return (
    <div className="map-container" hidden={isMobile && mobileView !== 'map'}>
      <div className={appConfig.LOGO_CLASSNAME}>
        <a href={appConfig.ABOUT_LINK_URL}>
          <img
            src={`/images/${appConfig.LOGO_FILENAME_ROOT}.png`}
            srcSet={`/images/${appConfig.LOGO_FILENAME_ROOT}@2x.png 2x`}
            alt="logo"
          />
        </a>
      </div>
      <div className="map" id="map" style={{ height: `${height}px` }}></div>
      {isMobile !== undefined && isMapLoaded && (
        <MapLayers isInitiallyVisible={!isMobile} mapRef={mapRef} />
      )}
    </div>
  );
};

export default Map;
