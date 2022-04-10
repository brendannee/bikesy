import { useState } from 'react';
import MapLayersItem from './MapLayersItem';

const MapLayers = ({ isInitiallyVisible }) => {
  const [isVisible, setisVisible] = useState(isInitiallyVisible);
  const toggleLegendVisibility = () => {
    setisVisible(!isVisible);
  };

  return isVisible ? (
    <div className="map-layers d-print-none">
      <div className="close-box" onClick={toggleLegendVisibility}>
        &minus;
      </div>
      <div>
        <MapLayersItem
          label="Multi-use Path"
          description="paved, separated (off the street) bikeways"
          iconClassName="class1"
        />
        <MapLayersItem
          label="Bike Lane"
          description="dedicated on-street bikeways, marked by striping on pavement"
          iconClassName="class2"
        />
        <MapLayersItem
          label="Bike Route"
          description="on-street routes signed for bicyclists"
          iconClassName="class3"
        />
      </div>
    </div>
  ) : (
    <div className="map-layers-open-box" onClick={toggleLegendVisibility}>
      Toggle Map Legend
    </div>
  );
};

export default MapLayers;
