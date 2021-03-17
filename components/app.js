/* global window, location, alert */

import React, { useEffect, useState } from 'react'
import NoSSR from 'react-no-ssr'
import polyline from '@mapbox/polyline'

const config = require('../frontendconfig.json')

import Controls from './controls.js'
import Directions from './directions.js'
import Elevation from './elevation.js'
import Map from './map.js'
import TitleBar from './titlebar.js'
import WelcomeModal from './welcome-modal.js'

import { getRoute } from '../lib/api.js'
import { logQuery } from '../lib/analytics.js'
import { handleError } from '../lib/error.js'
import { cleanElevationProfile } from '../lib/helper.js'
import { geocode, reverseGeocode } from '../lib/geocode.js'
import { latlngIsWithinBounds, updateMapSize, getPathDistance } from '../lib/map.js'
import { updateUrlParameters } from '../lib/url.js'

const App = () => {
  const elevationHeight = 175
  const [loading, setLoading] = useState(false)
  const [hills, setHills] = useState('med')
  const [safety, setSafety] = useState('med')
  const [mobileView, setMobileView] = useState('map')
  const [isMobile, setIsMobile] = useState()
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)
  const [startLocation, setStartLocation] = useState()
  const [endLocation, setEndLocation] = useState()
  const [startAddress, setStartAddress] = useState('')
  const [endAddress, setEndAddress] = useState('')
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined
  })
  const [path, setPath] = useState()
  const [distance, setDistance] = useState()
  const [steps, setSteps] = useState()
  const [elevationProfile, setElevationProfile] = useState()
  const [elevationVisible, setElevationVisible] = useState()
  let fetching = false;

  const handleResize = () => {
    setWindowSize({
      height: window.innerHeight,
      width: window.innerWidth
    })

    setIsMobile(checkMobile(window.innerWidth))
  }

  const updateRoute = async (selectedStartAddress, selectedEndAddress) => {
    clearPath()
    setLoading(true)
    setShowWelcomeModal(false)

    const [startLocation, endLocation] = await Promise.all([
      geocode(selectedStartAddress).catch(() => {
        setLoading(false)
        /* eslint-disable-next-line no-alert */
        alert('Invalid start address. Please try a different address.')
      }),
      geocode(selectedEndAddress).catch(() => {
        setLoading(false)
        /* eslint-disable-next-line no-alert */
        alert('Invalid end address. Please try a different address.')
      })
    ])

    if (!startLocation || !endLocation) {
      setLoading(false)
      return
    }

    if (!latlngIsWithinBounds(startLocation, 'start')) {
      setLoading(false)
      return
    }

    if (!latlngIsWithinBounds(endLocation, 'end')) {
      setLoading(false)
      return
    }

    setStartLocation(startLocation)
    setEndLocation(endLocation)
    setMobileView('map')
  }

  const fetchRoute = async () => {
    setLoading(true)

    try {
      const results = await getRoute(startLocation, endLocation, hills, safety)

      setLoading(false)

      if (!results) {
        handleError(new Error('No routes received'))
        return
      }

      const geoJSONPath = polyline.toGeoJSON(results.geometry)
      setPath(geoJSONPath)
      setDistance(getPathDistance(geoJSONPath))
      setSteps(results.steps)
      setElevationProfile(cleanElevationProfile(results.elevation_profile))

      logQuery(startAddress, endAddress, startLocation, endLocation)
    } catch (error) {
      handleError(error)
    }
  }

  const assignStartLocation = latlng => {
    clearPath()
    setStartLocation(latlng)
    setStartAddress('')

    reverseGeocode(latlng).then(address => {
      if (!address) {
        return handleError(new Error('Unable to get reverse geocoding result.'))
      }

      setStartAddress(address)
    })
  }

  const assignEndLocation = latlng => {
    clearPath()
    setEndLocation(latlng)
    setEndAddress('')

    reverseGeocode(latlng).then(address => {
      if (!address) {
        return handleError('Unable to get reverse geocoding result.')
      }

      setEndAddress(address)
    })
  }

  const updateControls = items => {
    if (items.startLocation) {
      assignStartLocation(items.startLocation)
    }

    if (items.hills) {
      setHills(items.hills)
    }

    if (items.safety) {
      setSafety(items.safety)
    }

    if (items.startAddress !== undefined) {
      setStartAddress(items.startAddress)
    }

    if (items.endAddress !== undefined) {
      setEndAddress(items.endAddress)
    }
  }

  const clearRoute = () => {
    clearPath()
    clearMarkers()
  }

  const toggleElevationVisibility = () => {
    setElevationVisible(!elevationVisible)
    updateMapSize()
  }

  const changeMobileView = mobileView => {
    setMobileView(mobileView)

    if (mobileView === 'map') {
      updateMapSize()
    }
  }

  const hideWelcomeModal = event => {
    event.preventDefault()
    setShowWelcomeModal(false)
  }

  const forceSSL = () => {
    if (location.protocol !== 'https:') {
      location.protocol = 'https:'
    }
  }

  const clearPath = () => {
    setPath(undefined)
    setSteps(undefined)
    setElevationProfile(undefined)
  }

  const clearMarkers = () => {
    setStartLocation(undefined)
    setEndLocation(undefined)
    setStartAddress(undefined)
    setEndAddress(undefined)
  }

  const checkMobile = width => {
    if (width === undefined) {
      return false
    }

    const mobileBreakpoint = 667
    return width <= mobileBreakpoint
  }

  const controlsHeight = 252
  const sidebarWidth = 300
  const titlebarHeight = 38
  let elevationWidth
  let directionsHeight
  let mapHeight = windowSize.height

  if (isMobile) {
    elevationWidth = windowSize.width
  } else {
    elevationWidth = windowSize.width - sidebarWidth
    directionsHeight = windowSize.height - controlsHeight
  }

  if (elevationVisible && elevationProfile) {
    mapHeight -= elevationHeight
  }

  if (isMobile) {
    mapHeight -= titlebarHeight
  }

  useEffect(() => {
    if (process && process.env.NODE_ENV !== 'development' && config.forceSSL) {
      forceSSL()
    }

    const url = new URL(window.location.href)

    if (url.searchParams.get('startAddress')) {
      setStartAddress(url.searchParams.get('startAddress'))
    }

    if (url.searchParams.get('endAddress')) {
      setEndAddress(url.searchParams.get('endAddress'))
    }

    if (url.searchParams.get('hills')) {
      setHills(url.searchParams.get('hills'))
    }

    if (url.searchParams.get('safety')) {
      setSafety(url.searchParams.get('safety'))
    }

    if (url.searchParams.get('startAddress') && url.searchParams.get('endAddress')) {
      updateRoute(url.searchParams.get('startAddress'), url.searchParams.get('endAddress'))
    }

    if (typeof window !== 'undefined') {
      const isMobileCalc = checkMobile(window.innerWidth)

      setWindowSize({
        height: window.innerHeight,
        width: window.innerWidth
      })
      setIsMobile(isMobileCalc)
      setElevationVisible(!isMobileCalc)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  useEffect(async () => {
    if (startLocation && endLocation && !fetching) {
      fetching = true
      await fetchRoute()
      fetching = false
    }
  }, [startLocation, endLocation])

  useEffect(() => {
    if (startAddress && endAddress) {
      updateUrlParameters({ startAddress, endAddress, hills, safety })
    }
  }, [startAddress, endAddress, hills, safety])

  return (
    <div>
      <TitleBar
        changeMobileView={changeMobileView}
        isMobile={isMobile}
        mobileView={mobileView}
      />
      <Controls
        updateRoute={updateRoute}
        clearRoute={clearRoute}
        startAddress={startAddress}
        endAddress={endAddress}
        hills={hills}
        safety={safety}
        loading={loading}
        isMobile={isMobile}
        mobileView={mobileView}
        updateControls={updateControls}
      />
      <Directions
        steps={steps}
        distance={distance}
        startLocation={startLocation}
        endLocation={endLocation}
        startAddress={startAddress}
        endAddress={endAddress}
        elevationProfile={elevationProfile}
        height={directionsHeight}
        isMobile={isMobile}
        mobileView={mobileView}
      />
      <NoSSR>
        <Map
          startLocation={startLocation}
          endLocation={endLocation}
          path={path}
          assignStartLocation={assignStartLocation}
          assignEndLocation={assignEndLocation}
          height={mapHeight}
          isMobile={isMobile}
          mobileView={mobileView}
        />
      </NoSSR>
      <Elevation
        elevationProfile={elevationProfile}
        width={elevationWidth}
        height={elevationHeight}
        toggleElevationVisibility={toggleElevationVisibility}
        elevationVisible={elevationVisible && Boolean(elevationProfile)}
        isMobile={isMobile}
        mobileView={mobileView}
      />
      <NoSSR>
        <WelcomeModal
          showWelcomeModal={showWelcomeModal}
          hideWelcomeModal={hideWelcomeModal}
        />
      </NoSSR>
    </div>
  )
}

export default App
