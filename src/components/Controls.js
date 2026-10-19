import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import _ from 'lodash'
import classNames from 'classnames'
import PlacesAutocomplete from './PlacesAutocomplete'

import { clearRoute } from '../redux/slices/search'
import appConfig from '../appConfig'
import {
  getRoutingControls,
  scenarioToSelections,
  selectionsToScenario,
} from '../lib/scenarios'
import crosshairIcon from './icons/crosshairs-solid.svg'
import circleNotchIcon from './icons/circle-notch-solid.svg'
import { geocode } from '../lib/geocode'
import { trackEvent } from '../lib/analytics'

const routingControls = getRoutingControls(appConfig)

const Controls = ({
  updateRoute,
  updateControls,
  mobileView,
  isMobile,
  scenario,
  loading,
}) => {
  const dispatch = useDispatch()
  const startAddress = useSelector((state) => state.search.startAddress)
  const startLocation = useSelector((state) => state.search.startLocation)
  const endAddress = useSelector((state) => state.search.endAddress)
  const endLocation = useSelector((state) => state.search.endLocation)

  // The selects always show the current scenario, so there is no separate state to sync.
  const selections = scenarioToSelections(appConfig, scenario)
  const [errorFields, setErrorFields] = useState([])
  const [geolocationPending, setGeolocationPending] = useState(false)
  const [startAddressInput, setStartAddressInput] = useState('')
  const [startCoordinates, setStartCoordinates] = useState()
  const [endAddressInput, setEndAddressInput] = useState('')
  const [endCoordinates, setEndCoordinates] = useState()
  const [startPlacePending, setStartPlacePending] = useState(false)
  const [endPlacePending, setEndPlacePending] = useState(false)

  const processForm = (event) => {
    event.preventDefault()
    trackEvent('route_submit', { scenario })

    updateControls({
      startAddress: startAddressInput,
      endAddress: endAddressInput,
    })
    handleForm()
  }

  const handleControlChange = (key) => (event) => {
    const nextScenario = selectionsToScenario(
      appConfig,
      { ...selections, [key]: event.target.value },
      key,
    )

    updateControls({ scenario: nextScenario })
    if (startAddressInput && endAddressInput) {
      handleForm()
    }
  }

  const getGeolocation = () => {
    trackEvent('geolocation', { outcome: 'requested' })
    if ('geolocation' in navigator) {
      setGeolocationPending(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          trackEvent('geolocation', { outcome: 'success' })
          updateControls({
            startLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          })
          setGeolocationPending(false)
        },
        (error) => {
          trackEvent('geolocation', {
            outcome:
              { 1: 'permission_denied', 2: 'unavailable', 3: 'timeout' }[
                error?.code
              ] || 'error',
          })
          alert('Unable to use geolocation in your browser.')
          setGeolocationPending(false)
        },
        {
          timeout: 15000,
        },
      )
    } else {
      trackEvent('geolocation', { outcome: 'unsupported' })
      alert('Geolocation is not available in your browser.')
    }
  }

  const handleForm = async () => {
    if (startPlacePending || endPlacePending) {
      return
    }

    const errorFields = validateForm()
    let updatedStartCoordinates = startCoordinates
    let updatedEndCoordinates = endCoordinates

    if (errorFields.length) {
      setErrorFields(errorFields)
      return false
    }

    setErrorFields([])

    if (!updatedStartCoordinates) {
      try {
        updatedStartCoordinates = await geocode(startAddressInput)
        setStartCoordinates(updatedStartCoordinates)
      } catch (error) {
        alert(`Error: Unable to find start address "${startAddressInput}".`)
        return
      }
    }

    if (!updatedEndCoordinates) {
      try {
        updatedEndCoordinates = await geocode(endAddressInput)
      } catch (error) {
        alert(`Error: Unable to find end address "${endAddressInput}".`)
        return
      }
    }

    return updateRoute({
      startAddress: startAddressInput,
      startLocation: updatedStartCoordinates,
      endAddress: endAddressInput,
      endLocation: updatedEndCoordinates,
    })
  }

  const validateForm = () => {
    const errorFields = []
    if (!startAddressInput) {
      errorFields.push('startAddress')
    }

    if (!endAddressInput) {
      errorFields.push('endAddress')
    }

    return errorFields
  }

  const getStartAddressPlaceholder = () => {
    if (geolocationPending) {
      return ''
    }

    return 'Start Address'
  }

  // If start address changes, update input to match
  useEffect(() => {
    if (startAddress !== startAddressInput) {
      setStartAddressInput(startAddress)
      setStartCoordinates(startLocation)
    }
  }, [startAddress])

  // If end address changes, update input to match
  useEffect(() => {
    if (endAddress !== endAddressInput) {
      setEndAddressInput(endAddress)
      setEndCoordinates(endLocation)
    }
  }, [endAddress])

  return (
    <div
      className="controls d-print-none"
      hidden={mobileView !== 'directions' && isMobile}
    >
      <form onSubmit={processForm}>
        <div
          className={classNames('form-group', 'form-inline', 'start-address', {
            'geolocation-pending': geolocationPending,
          })}
        >
          <label className="control-label" htmlFor="start-address">
            Start Location
          </label>
          <div className="start-icon" title="Start Location">
            S
          </div>
          <PlacesAutocomplete
            id="start-address"
            value={startAddressInput}
            onChange={(value) => {
              setStartAddressInput(value)
              setStartCoordinates()
            }}
            className={classNames('form-control', {
              'is-invalid': _.includes(errorFields, 'startAddress'),
            })}
            placeholder={getStartAddressPlaceholder()}
            onPlaceSelected={({ address, coordinates }) => {
              setStartAddressInput(address)
              setStartCoordinates(coordinates)
            }}
            onPendingChange={setStartPlacePending}
          />
          <img
            className="loading-animation"
            src={circleNotchIcon?.src ?? circleNotchIcon}
            alt=""
            aria-hidden="true"
          />
          <a
            className="btn btn-light btn-geolocation"
            title="Use my location"
            onClick={getGeolocation}
          >
            <img
              src={crosshairIcon?.src ?? crosshairIcon}
              alt=""
              aria-hidden="true"
            />
          </a>
        </div>
        <div className="form-group form-inline end-address">
          <label className="control-label" htmlFor="end-address">
            End Location
          </label>
          <div className="end-icon" title="End Location">
            E
          </div>
          <PlacesAutocomplete
            id="end-address"
            value={endAddressInput}
            onChange={(value) => {
              setEndAddressInput(value)
              setEndCoordinates()
            }}
            className={classNames('form-control', {
              'is-invalid': _.includes(errorFields, 'endAddress'),
            })}
            placeholder="End Address"
            onPlaceSelected={({ address, coordinates }) => {
              setEndAddressInput(address)
              setEndCoordinates(coordinates)
            }}
            onPendingChange={setEndPlacePending}
          />
        </div>
        {routingControls.map((control) => (
          <div
            key={control.key}
            className={classNames('form-group', 'form-inline', control.className)}
          >
            <label className="control-label">{control.label}</label>
            <select
              className="form-control"
              onChange={handleControlChange(control.key)}
              value={selections[control.key]}
            >
              {control.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
          </div>
        ))}
        <a
          href="#"
          className="clear-link"
          onClick={(event) => {
            event.preventDefault()
            trackEvent('route_clear')
            setStartAddressInput('')
            setEndAddressInput('')
            setStartCoordinates()
            setEndCoordinates()
            setErrorFields([])
            dispatch(clearRoute())
          }}
        >
          Clear
        </a>
        <button
          type="submit"
          className="btn btn-success btn-update-route"
          disabled={startPlacePending || endPlacePending}
        >
          {loading && (
            <img
              className="loading-animation"
              src={circleNotchIcon?.src ?? circleNotchIcon}
              alt=""
              aria-hidden="true"
            />
          )}{' '}
          Get Directions
        </button>
      </form>
    </div>
  )
}

export default Controls
