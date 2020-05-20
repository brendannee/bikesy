/* global navigator, alert */

const React = require('react')
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch, faCrosshairs } from '@fortawesome/free-solid-svg-icons'

const _ = require('lodash')
const classNames = require('classnames')

import { scenarioToComponents, componentsToScenario } from '../lib/scenarios'

class Controls extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      routeType: '3',
      hillReluctance: '1',
      errorFields: [],
      geolocationPending: false
    }

    this.processForm = event => {
      event.preventDefault()

      this.updateRoute()
    }

    this.handleStartAddressChange = event => {
      this.props.updateControls({ startAddress: event.target.value })
    }

    this.handleEndAddressChange = event => {
      this.props.updateControls({ endAddress: event.target.value })
    }

    this.handleRouteTypeChange = event => {
      const scenario = componentsToScenario({
        routeType: event.target.value,
        hillReluctance: this.state.hillReluctance
      })

      this.props.updateControls({ scenario })
      this.updateRoute()
    }

    this.handleHillReluctanceChange = event => {
      const scenario = componentsToScenario({
        routeType: this.state.hillReluctance,
        hillReluctance: event.target.value
      })

      this.props.updateControls({ scenario })
      this.updateRoute()
    }

    this.getGeolocation = () => {
      if ('geolocation' in navigator) {
        this.setState({
          geolocationPending: true
        })
        navigator.geolocation.getCurrentPosition(position => {
          this.props.updateControls({
            startLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          })
          this.setState({
            geolocationPending: false
          })
        }, () => {
          alert('Unable to use geolocation in your browser.')
          this.setState({
            geolocationPending: false
          })
        }, {
          timeout: 15000
        })
      } else {
        alert('Geolocation is not available in your browser.')
      }
    }
  }

  updateRoute() {
    const errorFields = this.validateForm()

    if (errorFields.length) {
      this.setState({ errorFields })
      return false
    }

    this.setState({ errorFields: [] })

    return this.props.updateRoute()
  }

  validateForm() {
    const errorFields = []
    if (!this.props.startAddress) {
      errorFields.push('startAddress')
    }

    if (!this.props.endAddress) {
      errorFields.push('endAddress')
    }

    return errorFields
  }

  getStartAddressPlaceholder() {
    if (this.state.geolocationPending) {
      return ''
    }

    return 'Start Address'
  }

  static getDerivedStateFromProps(nextProps, previousState) {
    const newState = {}

    if (nextProps.scenario) {
      const components = scenarioToComponents(nextProps.scenario)
      newState.hillReluctance = components.hillReluctance
      newState.routeType = components.routeType
    }

    return newState
  }

  render() {
    return (
      <div
        className="controls d-print-none"
        hidden={this.props.mobileView !== 'directions' && this.props.isMobile}
      >
        <form onSubmit={this.processForm}>
          <div
            className={classNames('form-group', 'form-inline', 'start-address', { 'geolocation-pending': this.state.geolocationPending })}
          >
            <label className="control-label">Start Location</label>
            <div className="start-icon" title="Start Location">S</div>
            <input
              type="text"
              value={this.props.startAddress}
              onChange={this.handleStartAddressChange}
              className={classNames('form-control', { 'is-invalid': _.includes(this.state.errorFields, 'startAddress') })}
              placeholder={this.getStartAddressPlaceholder()}
            />
            <FontAwesomeIcon icon={faCircleNotch} spin className="loading-animation" />
            <a
              className="btn btn-light btn-geolocation"
              title="Use my location"
              onClick={this.getGeolocation}
            >
              <FontAwesomeIcon icon={faCrosshairs} />
            </a>
          </div>
          <div className="form-group form-inline end-address">
            <label className="control-label">End Location</label>
            <div className="end-icon" title="End Location">E</div>
            <input
              type="text"
              value={this.props.endAddress}
              onChange={this.handleEndAddressChange}
              className={classNames('form-control', { 'is-invalid': _.includes(this.state.errorFields, 'endAddress') })}
              placeholder="End Address"
            />
          </div>
          <div className="form-group form-inline route-type">
            <label className="control-label">Route Type</label>
            <select
              className="form-control"
              onChange={this.handleRouteTypeChange}
              value={this.state.routeType}
            >
              <option value="1">Mostly bike paths & lanes</option>
              <option value="2">A reasonable route</option>
              <option value="3">A more direct route</option>
            </select>
          </div>
          <div className="form-group form-inline hill-reluctance">
            <label className="control-label">Hill Reluctance</label>
            <select
              className="form-control"
              onChange={this.handleHillReluctanceChange}
              value={this.state.hillReluctance}
            >
              <option value="1">Avoid at all costs</option>
              <option value="2">A reasonable route</option>
              <option value="3">Bring on the Hills!</option>
            </select>
          </div>
          <a href="#" className="clear-link" onClick={this.props.clearRoute}>Clear</a>
          <button
            type="submit"
            className="btn btn-success btn-update-route"
          >
            {this.props.loading && <FontAwesomeIcon icon={faCircleNotch} spin />} Get Directions
          </button>
        </form>
      </div>
    )
  }
}

Controls.propTypes = {
  updateRoute: PropTypes.func.isRequired,
  clearRoute: PropTypes.func.isRequired,
  startAddress: PropTypes.string,
  endAddress: PropTypes.string,
  loading: PropTypes.bool,
  isMobile: PropTypes.bool,
  mobileView: PropTypes.string.isRequired,
  updateControls: PropTypes.func.isRequired
}

export default Controls
