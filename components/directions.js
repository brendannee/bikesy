/* global window */

import React from 'react'
import osrmTextInstructions from 'osrm-text-instructions'

import Weather from './weather'

import { formatDistance, formatDistanceShort, formatTime, formatElevation, getElevationGain, metersToFeet, metersToMiles } from '../lib/helper'
import { getCenter } from '../lib/map'

const osrmti = osrmTextInstructions('v5')

const Directions = ({ steps, startAddress, endAddress, startLocation, endLocation, distance, elevationProfile, isMobile, mobileView, height }) => {
  const getDirections = () => {
    if (!steps) {
      return ''
    }

    let cumulativeDistance = 0
    const directionsList = steps.map((step, index) => {
      const item = (
        <li key={index} className="d-flex">
          <div className="mr-2 flex-shrink-0 directions-list-distance">
            {formatDistanceShort(metersToMiles(cumulativeDistance))}
          </div>
          <div dangerouslySetInnerHTML={{
            __html: osrmti.compile('en', step, {
              formatToken: (token, value) => {
                if (token === 'way_name') {
                  return `<span class="directions-list-way-name">${value}</span>`
                }

                return value
              }
            })
          }} />
        </li>
      )

      cumulativeDistance += step.distance

      return item
    })

    const location = getCenter(startLocation, endLocation)

    return (
      <div>
        <h3>Directions to <b>{endAddress}<span className="d-none d-print-inline"> from {startAddress}</span></b></h3>
        <div className="stats">
          <h3 className="d-none d-print-block">Ride Summary</h3>
          <b>{formatDistance(distance)}, {formatTime(distance)}</b><br />
          {elevationProfile && `${formatElevation(metersToFeet(getElevationGain(elevationProfile)))} of total climbing`}
          <Weather lat={location.lat} lng={location.lng} />
        </div>

        <h3 className="d-none d-print-block">Turn by Turn Directions</h3>
        <ul className="directions-list">
          {directionsList}
        </ul>
        <a href="#" className="d-print-none" onClick={window.print}><small>Print this map to view your route offline.</small></a>
      </div>
    )
  }

  return (
    <div
      className="directions"
      hidden={isMobile && mobileView !== 'directions'}
      style={{ height: height ? `${height}px` : 'auto' }}
    >
      {getDirections()}

      <div className="disclaimer">
        We offer no guarantee regarding roadway conditions or safety of the proposed routes. Use your best judgment when choosing a route. Obey all vehicle code provisions.
      </div>
      <a className="disclaimer" href="https://bikesy.com/about">About Bikesy</a>
    </div>
  )
}

export default Directions
