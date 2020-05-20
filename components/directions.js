/* global window */

const React = require('react')
import PropTypes from 'prop-types'

import Weather from './weather'

import { formatDistance, formatTime, formatElevation, getElevationGain, metersToFeet } from '../lib/helper'
import { getCenter } from '../lib/map'

class Directions extends React.Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  getDirections() {
    if (!this.props.directions) {
      return ''
    }

    const directionsList = this.props.directions.reduce((memo, direction, idx) => {
      if (direction[1] !== 'nameless') {
        memo.push(<li key={idx}><b>{direction[0]}</b> on <b>{direction[1]}</b></li>)
      }

      return memo
    }, [])

    directionsList.push((
      <li key="final"><b>arrive</b> at <b>{this.props.endAddress}</b></li>
    ))

    const location = getCenter(this.props.startLocation, this.props.endLocation)

    return (
      <div>
        <h3>Directions to <b>{this.props.endAddress}<span className="d-none d-print-inline"> from {this.props.startAddress}</span></b></h3>
        <div className="stats">
          <h3 className="d-none d-print-block">Ride Summary</h3>
          <b>{formatDistance(this.props.distance)}, {formatTime(this.props.distance)}</b><br />
          {formatElevation(metersToFeet(getElevationGain(this.props.elevationProfile)))} of total climbing
          <Weather location={location} />
        </div>

        <h3 className="d-none d-print-block">Turn by Turn Directions</h3>
        <ul className="directions-list">
          {directionsList}
        </ul>
        <a href="#" className="d-print-none" onClick={window.print}><small>Print this map to view your route offline.</small></a>
      </div>
    )
  }

  getDisclaimer() {
    return (
      <div className="disclaimer">
        We offer no guarantee regarding roadway conditions or safety of the proposed routes. Use your best judgment when choosing a route. Obey all vehicle code provisions.
      </div>
    )
  }

  render() {
    const height = this.props.height ? `${this.props.height}px` : 'auto'

    return (
      <div
        className="directions"
        hidden={this.props.isMobile && this.props.mobileView !== 'directions'}
        style={{ height }}
      >
        {this.getDirections()}
        {this.getDisclaimer()}
      </div>
    )
  }
}

Directions.propTypes = {
  directions: PropTypes.array,
  startLocation: PropTypes.object,
  endLocation: PropTypes.object,
  startAddress: PropTypes.string,
  endAddress: PropTypes.string,
  distance: PropTypes.number,
  elevationProfile: PropTypes.array,
  height: PropTypes.number,
  isMobile: PropTypes.bool,
  mobileView: PropTypes.string
}

export default Directions
