import { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import PlacesAutocomplete from './PlacesAutocomplete';

import { clearRoute } from '../redux/slices/search';
import appConfig from '../appConfig';
import { scenarioToComponents, componentsToScenario } from '../lib/scenarios';
import crosshairIcon from './icons/crosshairs-solid.svg';
import circleNotchIcon from './icons/circle-notch-solid.svg';
import { geocode } from '../lib/geocode';

const Controls = ({
  updateRoute,
  updateControls,
  mobileView,
  isMobile,
  scenario,
  loading,
}) => {
  const dispatch = useDispatch();
  const startAddress = useSelector((state) => state.search.startAddress);
  const startLocation = useSelector((state) => state.search.startLocation);
  const endAddress = useSelector((state) => state.search.endAddress);
  const endLocation = useSelector((state) => state.search.endLocation);

  const [routeType, setRouteType] = useState('3');
  const [hillReluctance, setHillReluctance] = useState('1');
  const [errorFields, setErrorFields] = useState([]);
  const [geolocationPending, setGeolocationPending] = useState(false);
  const [startAddressInput, setStartAddressInput] = useState('');
  const [startCoordinates, setStartCoordinates] = useState();
  const [endAddressInput, setEndAddressInput] = useState('');
  const [endCoordinates, setEndCoordinates] = useState();
  const [startPlacePending, setStartPlacePending] = useState(false);
  const [endPlacePending, setEndPlacePending] = useState(false);

  const processForm = (event) => {
    event.preventDefault();
    track('route_submit', { routeType, hillReluctance });

    updateControls({
      startAddress: startAddressInput,
      endAddress: endAddressInput,
    });
    handleForm();
  };

  const handleRouteTypeChange = (event) => {
    const scenario = componentsToScenario({
      routeType: event.target.value,
      hillReluctance,
    });

    updateControls({ scenario });
    if (startAddressInput && endAddressInput) {
      handleForm();
    }
  };

  const handleHillReluctanceChange = (event) => {
    const scenario = componentsToScenario({
      routeType,
      hillReluctance: event.target.value,
    });

    updateControls({ scenario });
    if (startAddressInput && endAddressInput) {
      handleForm();
    }
  };

  const getGeolocation = () => {
    track('geolocation_request');
    if ('geolocation' in navigator) {
      setGeolocationPending(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          track('geolocation_result', { status: 'success' });
          updateControls({
            startLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
          setGeolocationPending(false);
        },
        (error) => {
          track('geolocation_result', { status: 'error', errorCode: error.code });
          alert('Unable to use geolocation in your browser.');
          setGeolocationPending(false);
        },
        {
          timeout: 15000,
        },
      );
    } else {
      track('geolocation_result', { status: 'unsupported' });
      alert('Geolocation is not available in your browser.');
    }
  };

  const handleForm = async () => {
    if (startPlacePending || endPlacePending) {
      return;
    }

    const errorFields = validateForm();
    let updatedStartCoordinates = startCoordinates;
    let updatedEndCoordinates = endCoordinates;

    if (errorFields.length) {
      setErrorFields(errorFields);
      return false;
    }

    setErrorFields([]);

    if (!updatedStartCoordinates) {
      try {
        updatedStartCoordinates = await geocode(startAddressInput);
        setStartCoordinates(updatedStartCoordinates);
      } catch (error) {
        alert(`Error: Unable to find start address "${startAddressInput}".`);
        return;
      }
    }

    if (!updatedEndCoordinates) {
      try {
        updatedEndCoordinates = await geocode(endAddressInput);
      } catch (error) {
        alert(`Error: Unable to find end address "${endAddressInput}".`);
        return;
      }
    }

    return updateRoute({
      startAddress: startAddressInput,
      startLocation: updatedStartCoordinates,
      endAddress: endAddressInput,
      endLocation: updatedEndCoordinates,
    });
  };

  const validateForm = () => {
    const errorFields = [];
    if (!startAddressInput) {
      errorFields.push('startAddress');
    }

    if (!endAddressInput) {
      errorFields.push('endAddress');
    }

    return errorFields;
  };

  const getStartAddressPlaceholder = () => {
    if (geolocationPending) {
      return '';
    }

    return 'Start Address';
  };

  useEffect(() => {
    const components = scenarioToComponents(scenario);
    if (components.hillReluctance !== hillReluctance) {
      setHillReluctance(components.hillReluctance);
    }

    if (components.routeType !== routeType) {
      setRouteType(components.routeType);
    }
  }, [hillReluctance, routeType, scenario]);

  // If start address changes, update input to match
  useEffect(() => {
    if (startAddress !== startAddressInput) {
      setStartAddressInput(startAddress);
      setStartCoordinates(startLocation);
    }
  }, [startAddress]);

  // If end address changes, update input to match
  useEffect(() => {
    if (endAddress !== endAddressInput) {
      setEndAddressInput(endAddress);
      setEndCoordinates(endLocation);
    }
  }, [endAddress]);

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
              setStartAddressInput(value);
              setStartCoordinates();
            }}
            className={classNames('form-control', {
              'is-invalid': _.includes(errorFields, 'startAddress'),
            })}
            placeholder={getStartAddressPlaceholder()}
            onPlaceSelected={({ address, coordinates }) => {
              setStartAddressInput(address);
              setStartCoordinates(coordinates);
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
            <img src={crosshairIcon?.src ?? crosshairIcon} alt="" aria-hidden="true" />
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
              setEndAddressInput(value);
              setEndCoordinates();
            }}
            className={classNames('form-control', {
              'is-invalid': _.includes(errorFields, 'endAddress'),
            })}
            placeholder="End Address"
            onPlaceSelected={({ address, coordinates }) => {
              setEndAddressInput(address);
              setEndCoordinates(coordinates);
            }}
            onPendingChange={setEndPlacePending}
          />
        </div>
        <div className="form-group form-inline route-type">
          <label className="control-label">Route Type</label>
          <select
            className="form-control"
            onChange={handleRouteTypeChange}
            value={routeType}
          >
            {appConfig.ROUTE_TYPE_OPTIONS.map((routeType) => (
              <option key={routeType.value} value={routeType.value}>
                {routeType.text}
              </option>
            ))}
          </select>
        </div>
        {!!appConfig.HILL_ROUTING_OPTIONS.length && (
          <div className="form-group form-inline hill-reluctance">
            <label className="control-label">Hill Reluctance</label>
            <select
              className="form-control"
              onChange={handleHillReluctanceChange}
              value={hillReluctance}
            >
              {appConfig.HILL_ROUTING_OPTIONS.map((hillRoutingOption) => (
                <option key={hillRoutingOption.value} value={hillRoutingOption.value}>
                  {hillRoutingOption.text}
                </option>
              ))}
            </select>
          </div>
        )}
        <a
          href="#"
          className="clear-link"
          onClick={(event) => {
            event.preventDefault();
            track('route_clear');
            setStartAddressInput('');
            setEndAddressInput('');
            setStartCoordinates();
            setEndCoordinates();
            setErrorFields([]);
            dispatch(clearRoute());
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
  );
};

export default Controls;
