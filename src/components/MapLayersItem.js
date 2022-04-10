import { useState } from 'react';

const MapLayersItem = ({ type, label, description, iconClassName, isInitiallyChecked }) => {
  const [isChecked, setIsChecked] = useState(isInitiallyChecked);
  
  const onChange = () => {
    // TODO actually toggle on the map
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
