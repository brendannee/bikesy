/* global window, alert */

const React = require('react')
import NoSSR from 'react-no-ssr'
const polyline = require('@mapbox/polyline')

const config = require('../frontendconfig.json')

import Controls from './controls'
import Directions from './directions'
import Elevation from './elevation'
import Map from './map'
import TitleBar from './titlebar'
import WelcomeModal from './welcome_modal'

import { getRoute } from '../lib/api'
import { logQuery } from '../lib/analytics'
import { handleError } from '../lib/error'
import { geocode, reverseGeocode } from '../lib/geocode'
import { latlngIsWithinBounds, updateMapSize, getPathDistance } from '../lib/map'
import { updateUrlParams, readUrlParams, validateUrlParams } from '../lib/url'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      scenario: '5',
      mobileView: 'map',
      elevationHeight: 175,
      showWelcomeModal: true,
      startAddress: '',
      endAddress: ''
    }

    this.handleResize = () => {
      this.setState({
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth,
        isMobile: this.isMobile(window.innerWidth)
      })
    }

    this.updateRoute = () => {
      this.clearPath()
      this.setState({
        loading: true,
        showWelcomeModal: false
      })
      const promises = [
        geocode(this.state.startAddress).catch(() => {
          this.setState({ loading: false })
          alert('Invalid start address. Please try a different address.')
        }),
        geocode(this.state.endAddress).catch(() => {
          this.setState({ loading: false })
          alert('Invalid end address. Please try a different address.')
        })
      ]
      Promise.all(promises)
        .then(results => {
          if (!results || !results[0] || !results[1]) {
            this.setState({ loading: false })
            return
          }

          if (!latlngIsWithinBounds(results[0], 'start')) {
            this.setState({ loading: false })
            return
          }

          if (!latlngIsWithinBounds(results[1], 'end')) {
            this.setState({ loading: false })
            return
          }

          this.setState({
            startLocation: results[0],
            endLocation: results[1],
            mobileView: 'map'
          })

          this.fetchRoute()
        })
    }

    this.fetchRoute = () => {
      this.setState({ loading: true })
      getRoute(this.state.startLocation, this.state.endLocation, this.state.scenario)
        .then(results => {
          this.setState({ loading: false })
          if (!results.path || !results.path.length) {
            handleError(new Error('No path recieved'))
            return
          }

          const path = polyline.toGeoJSON(results.path[0])
          this.setState({
            path,
            distance: getPathDistance(path),
            directions: results.directions,
            elevationProfile: results.elevation_profile
          })
          updateUrlParams([this.state.startAddress, this.state.endAddress, this.state.scenario])
          logQuery(this.state.startAddress, this.state.endAddress, this.state.startLocation, this.state.endLocation)
        })
        .catch(handleError)
    }

    this.setStartLocation = latlng => {
      this.clearPath()
      this.setState({
        startLocation: latlng,
        startAddress: ''
      })

      if (this.state.endLocation) {
        this.fetchRoute()
      }

      reverseGeocode(latlng).then(address => {
        if (!address) {
          return handleError(new Error('Unable to get reverse geocoding result.'))
        }

        this.setState({
          startAddress: address
        })

        updateUrlParams([this.state.startAddress, this.state.endAddress, this.state.scenario])
      })
    }

    this.setEndLocation = latlng => {
      this.clearPath()
      this.setState({
        endLocation: latlng,
        endAddress: ''
      })

      if (this.state.startLocation) {
        this.fetchRoute()
      }

      reverseGeocode(latlng).then(address => {
        if (!address) {
          return handleError('Unable to get reverse geocoding result.')
        }

        this.setState({
          endAddress: address
        })

        updateUrlParams([this.state.startAddress, this.state.endAddress, this.state.scenario])
      })
    }

    this.updateControls = items => {
      if (items.startLocation) {
        this.setStartLocation(items.startLocation)
      } else if (items.scenario) {
        this.setState({ scenario: items.scenario })
      } else if (items.startAddress !== undefined) {
        this.setState({ startAddress: items.startAddress })
      } else if (items.endAddress !== undefined) {
        this.setState({ endAddress: items.endAddress })
      }
    }

    this.clearRoute = () => {
      this.clearPath()
      this.clearMarkers()
    }

    this.toggleElevationVisibility = () => {
      this.setState({
        elevationVisible: !this.state.elevationVisible
      }, () => {
        updateMapSize()
      })
    }

    this.changeMobileView = mobileView => {
      this.setState({
        mobileView
      }, () => {
        if (this.state.mobileView === 'map') {
          updateMapSize()
        }
      })
    }

    this.hideWelcomeModal = e => {
      e.preventDefault()
      this.setState({
        showWelcomeModal: false
      })
    }
  }

  forceSSL() {
    if (location.protocol !== 'https:') {
      location.protocol = 'https:'
    }
  }

  componentDidMount() {
    if (process && process.env.NODE_ENV !== 'development' && config.forceSSL) {
      this.forceSSL()
    }

    const isMobile = this.isMobile(window.innerWidth)

    this.setState({
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      isMobile,
      elevationVisible: !isMobile
    })

    window.addEventListener('resize', this.handleResize)
    const urlParameters = readUrlParams()

    if (validateUrlParams(urlParameters)) {
      this.setState({
        startAddress: urlParameters[0],
        endAddress: urlParameters[1],
        scenario: urlParameters[2]
      }, this.updateRoute)
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }

  clearPath() {
    this.setState({
      path: undefined,
      directions: undefined,
      elevationProfile: undefined
    })
  }

  clearMarkers() {
    this.setState({
      startLocation: undefined,
      endLocation: undefined,
      startAddress: '',
      endAddress: ''
    })
  }

  isMobile(width) {
    if (width === undefined) {
      return false
    }

    const mobileBreakpoint = 667
    return width <= mobileBreakpoint
  }

  render() {
    const controlsHeight = 252
    const sidebarWidth = 300
    const titlebarHeight = 38
    let elevationWidth
    let directionsHeight
    let mapHeight = this.state.windowHeight

    if (this.state.isMobile) {
      elevationWidth = this.state.windowWidth
    } else {
      elevationWidth = this.state.windowWidth - sidebarWidth
      directionsHeight = this.state.windowHeight - controlsHeight
    }

    if (this.state.elevationVisible && this.state.elevationProfile) {
      mapHeight -= this.state.elevationHeight
    }

    if (this.state.isMobile) {
      mapHeight -= titlebarHeight
    }

    return (
      <div>
        <TitleBar
          changeMobileView={this.changeMobileView}
          isMobile={this.state.isMobile}
          mobileView={this.state.mobileView}
        />
        <Controls
          updateRoute={this.updateRoute}
          clearRoute={this.clearRoute}
          startAddress={this.state.startAddress}
          endAddress={this.state.endAddress}
          scenario={this.state.scenario}
          loading={this.state.loading}
          isMobile={this.state.isMobile}
          mobileView={this.state.mobileView}
          updateControls={this.updateControls}
        />
        <Directions
          directions={this.state.directions}
          distance={this.state.distance}
          startLocation={this.state.startLocation}
          endLocation={this.state.endLocation}
          startAddress={this.state.startAddress}
          endAddress={this.state.endAddress}
          elevationProfile={this.state.elevationProfile}
          height={directionsHeight}
          isMobile={this.state.isMobile}
          mobileView={this.state.mobileView}
        />
        <NoSSR>
          <Map
            startLocation={this.state.startLocation}
            endLocation={this.state.endLocation}
            path={this.state.path}
            setStartLocation={this.setStartLocation}
            setEndLocation={this.setEndLocation}
            height={mapHeight}
            isMobile={this.state.isMobile}
            mobileView={this.state.mobileView}
          />
        </NoSSR>
        <Elevation
          elevationProfile={this.state.elevationProfile}
          width={elevationWidth}
          height={this.state.elevationHeight}
          toggleElevationVisibility={this.toggleElevationVisibility}
          elevationVisible={this.state.elevationVisible && Boolean(this.state.elevationProfile)}
          isMobile={this.state.isMobile}
          mobileView={this.state.mobileView}
        />
        <NoSSR>
          <WelcomeModal
            showWelcomeModal={this.state.showWelcomeModal}
            hideWelcomeModal={this.hideWelcomeModal}
          />
        </NoSSR>
      </div>
    )
  }
}

export default App
