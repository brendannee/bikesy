import { useState } from 'react';

const MapLayers = ({ isInitiallyVisible }) => {
  const [isVisible, setisVisible] = useState(isInitiallyVisible);
  const toggleLegendVisibility = () => {
    setisVisible(!isVisible);
  };

  return (
    isVisible ? (
      <div className="map-layers d-print-none" >
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
      </div >
    ) : (
      <div className="map-layers-open-box" onClick={toggleLegendVisibility}>
        Toggle Map Legend
      </div>
    )
  )
}

export default MapLayers
