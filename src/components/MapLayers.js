import { useState } from 'react';

import appConfig from 'appConfig';
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
        {appConfig.MAP_LAYERS.map((layer) => (
          <MapLayersItem
            label={layer.label}
            description={layer.description}
            iconClassName={layer.iconClassName}
            key={layer.label}
          />
        ))}
      </div>
    </div>
  ) : (
    <div className="map-layers-open-box" onClick={toggleLegendVisibility}>
      Toggle Map Legend
    </div>
  );
};

export default MapLayers;
