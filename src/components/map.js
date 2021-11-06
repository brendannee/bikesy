import { useEffect, useRef } from 'react';

import {
  latlngIsWithinBounds,
  drawMap,
  updateStartMarker,
  updateEndMarker,
  updatePath,
  updateMapSize,
} from 'lib/map';

const Map = ({
  isMobile,
  mobileView,
  height,
  startLocation,
  endLocation,
  path,
  assignStartLocation,
  assignEndLocation,
}) => {
  const startLocationRef = useRef(startLocation);
  const endLocationRef = useRef(endLocation);

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
      } else if (type === 'end') {
        assignEndLocation(latlng);
      }
    }
  };

  useEffect(() => {
    drawMap(handleMapClick, handleMarkerDrag);
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
    updatePath(path);
  }, [path]);

  useEffect(() => {
    updateMapSize();
  }, [height]);

  return (
    <div className="map-container" hidden={isMobile && mobileView !== 'map'}>
      <div className="map" id="map" style={{ height: `${height}px` }}></div>
    </div>
  );
};

export default Map;
