import { useEffect } from 'react';

import {
  latlngIsWithinBounds,
  drawMap,
  updateStartMarker,
  updateEndMarker,
  updatePath,
  updateMapSize,
} from 'lib/map';

const Map = () => {
  const startLocation = useSelector((state) => state.search.startLocation);
  const endLocation = useSelector((state) => state.search.endLocation);

  // const assignStartLocation = (latlng) => {
  //   clearPath();
  //   setStartLocation(latlng);
  //   setStartAddress('');

  //   reverseGeocode(latlng).then((address) => {
  //     if (!address) {
  //       return handleError(new Error('Unable to get reverse geocoding result.'));
  //     }

  //     setStartAddress(address);
  //   });
  // };

  // const assignEndLocation = (latlng) => {
  //   clearPath();
  //   setEndLocation(latlng);
  //   setEndAddress('');

  //   reverseGeocode(latlng).then((address) => {
  //     if (!address) {
  //       return handleError('Unable to get reverse geocoding result.');
  //     }

  //     setEndAddress(address);
  //   });
  // };

  const handleMapClick = (latlng) => dispatch(addLocation(latlng));

  //   if (!startLocationRef.current) {
  //     if (latlngIsWithinBounds(latlng)) {
  //       assignStartLocation(latlng);
  //     }
  //   } else if (!endLocationRef.current) {
  //     if (latlngIsWithinBounds(latlng)) {
  //       assignEndLocation(latlng);
  //     }
  //   }
  // };

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
