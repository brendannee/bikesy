import React, { useState } from 'react';

import Card from 'components/Card';

const MapLegend = () => {
  const [legendVisible, setLegendVisible] = useState();
  const [bikeLockersVisible, setBikeLockersVisible] = useState(false);

  const toggleBikeLockerVisibility = () => {
    toggleBikeLockerLayer(!bikeLockersVisible);
    setBikeLockersVisible(!bikeLockersVisible);
  };

  return (
    <Card className="map-layers">
      <div className="map-legend-item" title="paved, separated (off the street) bikeways">
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
      <div className="map-legend-item" title="on-street routes signed for bicyclists">
        <div className="map-legend-icon class3"></div>
        <label>Bike Route</label>
      </div>
    </Card>
  );
};

export default MapLegend;
