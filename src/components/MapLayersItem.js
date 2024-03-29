import * as _ from 'lodash';
import { useEffect, useState } from 'react';
import { getMapboxDatasetURL } from 'lib/map';

const MapLayersItem = ({
  type,
  label,
  popup,
  description,
  iconClassName,
  isInitiallyChecked,
  datasetId,
  layerProperties,
  mapRef,
}) => {
  const [isChecked, setIsChecked] = useState(isInitiallyChecked);

  const loadIconIntoMap = (imgUrl) => {
    if (imgUrl && !mapRef.current.hasImage(imgUrl)) {
      mapRef.current.loadImage(imgUrl, (error, image) => {
        if (error) throw error;
        // Prevent adding the same image twice in case multiple components have loaded the image at the same time
        if (!mapRef.current.hasImage(imgUrl)) {
          mapRef.current.addImage(imgUrl, image);
        }
        if (isChecked) {
          addToMap();
        }
      });
    }
  };

  useEffect(() => {
    const imgUrl = _.get(layerProperties, 'layout.icon-image');
    // Icon layers need to be loaded into the map before we can addToMap
    if (imgUrl) {
      loadIconIntoMap(imgUrl);
    } else {
      if (isChecked) {
        addToMap();
      }
    }
  }, [label, layerProperties]);

  const addToMap = () => {
    if (!mapRef.current.getSource(label)) {
      mapRef.current.addSource(label, {
        type: 'geojson',
        data: getMapboxDatasetURL(datasetId),
      });
    }
    if (!mapRef.current.getLayer(label)) {
      mapRef.current.addLayer({
        ...layerProperties,
        id: label,
        source: label,
      });
    }

    if (popup) {
      // Change cursor to pointer on hover.
      mapRef.current.on('mouseenter', label, () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      mapRef.current.on('mouseleave', label, () => {
        mapRef.current.getCanvas().style.cursor = '';
      });

      mapRef.current.on('click', label, (e) => {
        new mapboxgl.Popup()
          .setLngLat(e.features[0].geometry.coordinates)
          .setHTML(popup(e.features[0]))
          .addTo(mapRef.current);
      });
    }
  };

  const removeFromMap = () => {
    if (mapRef.current.getLayer(label)) {
      mapRef.current.removeLayer(label);
    }
  };

  const onChange = () => {
    if (!isChecked) {
      addToMap();
    } else {
      removeFromMap();
    }
    setIsChecked(!isChecked);
  };

  const renderInnerLabel = () => {
    switch (type) {
      case 'static':
        return label;
      case 'mapbox-dataset':
        return (
          <>
            <input type="checkbox" checked={isChecked} onChange={onChange} />
            <span>{label}</span>
          </>
        );
      default:
        throw new Error(`Unexpected type ${type} for map layer with label ${label}`);
    }
  };

  return (
    <div className="map-legend-item" title={description}>
      <div className={`map-legend-icon ${iconClassName}`}></div>
      <label>{renderInnerLabel()}</label>
    </div>
  );
};
export default MapLayersItem;
