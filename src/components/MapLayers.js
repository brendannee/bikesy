import { useState } from 'react';

import appConfig from 'appConfig';
import MapLayersItem from './MapLayersItem';

const MapLayers = ({ isInitiallyVisible, mapRef }) => {
  const [isVisible, setIsVisible] = useState(isInitiallyVisible);
  const toggleLegendVisibility = () => {
    setIsVisible(!isVisible);
  };

  return isVisible ? (
    <div className="map-layers d-print-none">
      <div className="close-box" onClick={toggleLegendVisibility}>
        &minus;
      </div>
      <div>
        {appConfig.MAP_LAYERS.map((layer) => (
          <MapLayersItem
            type={layer.type}
            label={layer.label}
            description={layer.description}
            iconClassName={layer.iconClassName}
            layerProperties={layer.layerProperties}
            datasetId={layer.datasetId}
            isInitiallyChecked={layer.isInitiallyChecked}
            mapRef={mapRef}
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
