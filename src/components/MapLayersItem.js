import { useEffect, useState } from 'react';
import { getMapboxDatasetURL } from 'lib/map';

const MapLayersItem = ({ type, label, description, iconClassName, isInitiallyChecked, datasetId, iconURL, mapRef }) => {
  const [isChecked, setIsChecked] = useState(isInitiallyChecked);
  
  const loadIconIntoMap = () => {
    mapRef.current.loadImage(
      iconURL,
      (error, image) => {
        if (error) throw error;
        mapRef.current.addImage(label, image);
      }
    )
  }

  const unloadIconFromMap = () => {
    // TODO consider checking if hasImage first.
    if (mapRef.current.hasImage(label)) {
      mapRef.current.removeImage(label);
    }
  }

  useEffect(() => {
    if (iconURL) {
      loadIconIntoMap();
    }
    return unloadIconFromMap;
  }, [label, iconURL]);

  const onChange = () => {
    if (!isChecked) {
      // Turn on layer
      if (!mapRef.current.getSource(label)) {
        mapRef.current.addSource(label, {
          type: 'geojson',
          data: getMapboxDatasetURL(datasetId),
        })
      }
      if (!mapRef.current.getLayer(label)) {
        mapRef.current.addLayer({
          'id': label,
          'type': 'symbol',
          'source': label,
          'layout': {
            'icon-image': label,
            'icon-size': 0.25,
          }
        });
      }
    } else {
      // Turn off layer
      if (mapRef.current.getLayer(label)) {
        mapRef.current.removeLayer(label)
      }
    }
    setIsChecked(!isChecked);
    
  }

  switch (type) {
    case 'static':
      return (
        <div className="map-legend-item" title={description}>
          <div className={`map-legend-icon ${iconClassName}`}></div>
          <label>{label}</label>
        </div>
      );
    case 'mapbox-dataset':
      return (
        <div className="map-legend-item" title={description}>
          <div className={`map-legend-icon ${iconClassName}`}></div>
          <label>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={onChange}
            />
            <span>{label}</span>
          </label>
        </div>
      );
    default:
      throw new Error(`Unexpected type ${type} for map layer with label ${label}`)
  }
  
};
export default MapLayersItem;
