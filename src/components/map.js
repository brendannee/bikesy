import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

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
  assignStartLocation,
  assignEndLocation,
}) => {
  const startLocation = useSelector((state) => state.search.startLocation);
  const endLocation = useSelector((state) => state.search.endLocation);
  const path = useSelector((state) => state.search.path);

  const [legendVisible, setLegendVisible] = useState(!isMobile);

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

  const toggleLegendVisibility = () => {
    setLegendVisible(!legendVisible);
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
      <div className="logo">
        <img
          src="/images/bikesy-logo.png"
          srcSet="/images/bikesy-logo@2x.png 2x"
          alt="logo"
        />
      </div>
      <div className="map" id="map" style={{ height: `${height}px` }}></div>
      {legendVisible ? (
        <div className="map-layers d-print-none">
          <div className="close-box" onClick={toggleLegendVisibility}>
            &minus;
          </div>
          <div>
            <div
              className="map-legend-item"
              title="paved, separated (off the street) bikeways"
            >
              <div className="map-legend-icon class1"></div>
              <label>Multi-use Path</label>
            </div>
            <div
              className="map-legend-item"
              title="dedicated on-street bikeways, marked by striping on pavement"
            >
              <div className="map-legend-icon class2"></div>
              <label>Bike Lane</label>
            </div>
            <div
              className="map-legend-item"
              title="on-street routes signed for bicyclists"
            >
              <div className="map-legend-icon class3"></div>
              <label>Bike Route</label>
            </div>
          </div>
        </div>
      ) : (
        <div className="map-layers-open-box" onClick={toggleLegendVisibility}>
          Toggle Map Legend
        </div>
      )}
    </div>
  );
};

export default Map;
