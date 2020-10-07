import React, { useState, useEffect } from 'react'

import { latlngIsWithinBounds, drawMap, updateStartMarker, updateEndMarker, updatePath, updateMapSize, toggleBikeLockerLayer } from '../lib/map'
const config = require('../frontendconfig.json')

const Map = ({ isMobile, mobileView, height, startLocation, endLocation, path, assignStartLocation, assignEndLocation }) => {
  const [legendVisible, setLegendVisible] = useState(!isMobile)
  const [bikeLockersVisible, setBikeLockersVisible] = useState(false)

  const handleMapClick = latlng => {
    if (!startLocation) {
      if (latlngIsWithinBounds(latlng)) {
        assignStartLocation(latlng)
      }
    } else if (!endLocation) {
      if (latlngIsWithinBounds(latlng)) {
        assignEndLocation(latlng)
      }
    }
  }

  const handleMarkerDrag = (latlng, type) => {
    if (latlngIsWithinBounds(latlng)) {
      if (type === 'start') {
        assignStartLocation(latlng)
      } else if (type === 'end') {
        assignEndLocation(latlng)
      }
    }
  }

  const toggleLegendVisibility = () => {
    setLegendVisible(!legendVisible)
  }

  const toggleBikeLockerVisibility = () => {
    toggleBikeLockerLayer(!bikeLockersVisible)
    setBikeLockersVisible(!bikeLockersVisible)
  }

  useEffect(() => {
    drawMap(handleMapClick, handleMarkerDrag)
  }, [])

  useEffect(() => {
    updateStartMarker(startLocation)
  }, [startLocation])

  useEffect(() => {
    updateEndMarker(endLocation)
  }, [endLocation])

  useEffect(() => {
    updatePath(path)
  }, [path])

  useEffect(() => {
    updateMapSize()
  }, [height])


  return (
    <div
      className="map-container"
      hidden={isMobile && mobileView !== 'map'}
    >
      <div className="logo">
        <img src="/images/bikesy-logo.png" srcSet="/images/bikesy-logo@2x.png 2x" alt="logo" />
      </div>
      <div className="map" id="map" style={{ height: `${height}px` }}></div>
      { legendVisible ? (
        <div className="map-layers d-print-none">
          <div
            className="close-box"
            onClick={toggleLegendVisibility}
          >&minus;</div>
          <div>
            <div className="map-legend-item" title="bike lockers">
              <div className="map-legend-icon bike-lockers"></div>
              <label>
                <input type="checkbox" value={bikeLockersVisible} onChange={toggleBikeLockerVisibility} /> Bike Lockers
              </label>
            </div>
            <div className="map-legend-item" title="paved, separated (off the street) bikeways">
              <div className="map-legend-icon class1"></div>
              <label>Multi-use Path</label>
            </div>
            <div className="map-legend-item" title="dedicated on-street bikeways, marked by striping on pavement">
              <div className="map-legend-icon class2"></div>
              <label>Bike Lane</label>
            </div>
            <div className="map-legend-item" title="on-street routes signed for bicyclists">
              <div className="map-legend-icon class3"></div>
              <label>Bike Route</label>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="map-layers-open-box"
          onClick={toggleLegendVisibility}
        >Toggle Map Legend</div>
      )}
    </div>
  )
}

export default Map
