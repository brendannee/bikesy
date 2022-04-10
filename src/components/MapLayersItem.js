import * as _ from 'lodash';
import { useEffect, useState } from 'react';
import { getMapboxDatasetURL } from 'lib/map';

const MapLayersItem = ({ type, label, description, iconClassName, isInitiallyChecked, datasetId, layerProperties, mapRef }) => {
  const [isChecked, setIsChecked] = useState(isInitiallyChecked);

  const loadIconIntoMap = () => {
    const imgUrl = _.get(layerProperties, 'layout.icon-image');
    if (imgUrl && !mapRef.current.hasImage(imgUrl)) {
      mapRef.current.loadImage(
        imgUrl,
        (error, image) => {
          if (error) throw error;
          // TODO consider whether the image might have already been added while loading
          // Check again? Somehow prevent duplicate loading?
          mapRef.current.addImage(imgUrl, image);
          console.log('loaded ', imgUrl)
        }
      )
    }
  }

  useEffect(() => {
    loadIconIntoMap();
  }, [label, layerProperties]);

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
          ...layerProperties,
          'id': label,
          'source': label,
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
