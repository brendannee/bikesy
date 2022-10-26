import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { usePlacesWidget } from 'react-google-autocomplete';

import { clearRoute } from '@redux/slices/search';
import appConfig from 'appConfig';
import { scenarioToComponents, componentsToScenario } from 'lib/scenarios';
import Crosshairicon from './icons/crosshairs-solid.svg';
import CircleNotchIcon from './icons/circle-notch-solid.svg';
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

  const processForm = (event) => {
    event.preventDefault();

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
    if ('geolocation' in navigator) {
      setGeolocationPending(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateControls({
            startLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
          setGeolocationPending(false);
        },
        () => {
          alert('Unable to use geolocation in your browser.');
          setGeolocationPending(false);
        },
        {
          timeout: 15000,
        }
      );
    } else {
      alert('Geolocation is not available in your browser.');
    }
  };

  const handleForm = async () => {
    const errorFields = validateForm();
    let updatedStartCoordinates = startCoordinates
    let updatedEndCoordinates = endCoordinates

    if (errorFields.length) {
      setErrorFields(errorFields);
      return false;
    }

    setErrorFields([]);

    if (!updatedStartCoordinates) {
      try {
        updatedStartCoordinates = await geocode(startAddressInput)
        setStartCoordinates(updatedStartCoordinates)
      } catch (error) {
        alert(`Error: Unable to find start address "${startAddressInput}".`);
        return;
      }
    }

    if (!updatedEndCoordinates) {
      try {
        updatedEndCoordinates = await geocode(endAddressInput)
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
  }, [scenario]);

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

  const bounds = {
    north: appConfig.SEARCH_BOUNDS.TOP,
    east: appConfig.SEARCH_BOUNDS.RIGHT,
    south: appConfig.SEARCH_BOUNDS.BOTTOM,
    west: appConfig.SEARCH_BOUNDS.LEFT,
  };

  const { ref: startAddressRef } = usePlacesWidget({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (result) => {
      setStartAddressInput(result.formatted_address);
      setStartCoordinates({
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
      });
    },
    options: {
      types: ['geocode'],
      bounds,
      fields: ['formatted_address', 'geometry.location'],
      strictBounds: true,
    },
  });

  const { ref: endAddressRef } = usePlacesWidget({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (result) => {
      setEndAddressInput(result.formatted_address);
      setEndCoordinates({
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
      });
    },
    options: {
      types: ['geocode'],
      bounds,
      fields: ['formatted_address', 'geometry.location'],
      strictBounds: true,
    },
  });

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
          <label className="control-label">Start Location</label>
          <div className="start-icon" title="Start Location">
            S
          </div>
          <input
            type="text"
            value={startAddressInput}
            onChange={(event) => {
              setStartAddressInput(event.target.value)
              setStartCoordinates()
            }}
            className={classNames('form-control', {
              'is-invalid': _.includes(errorFields, 'startAddress'),
            })}
            placeholder={getStartAddressPlaceholder()}
            ref={startAddressRef}
          />
          <CircleNotchIcon className="loading-animation" />
          <a
            className="btn btn-light btn-geolocation"
            title="Use my location"
            onClick={getGeolocation}
          >
            <Crosshairicon />
          </a>
        </div>
        <div className="form-group form-inline end-address">
          <label className="control-label">End Location</label>
          <div className="end-icon" title="End Location">
            E
          </div>
          <input
            type="text"
            value={endAddressInput}
            onChange={(event) => {
              setEndAddressInput(event.target.value)
              setEndCoordinates()
            }}
            className={classNames('form-control', {
              'is-invalid': _.includes(errorFields, 'endAddress'),
            })}
            placeholder="End Address"
            ref={endAddressRef}
          />
        </div>
        <div className="form-group form-inline route-type">
          <label className="control-label">Route Type</label>
          <select
            className="form-control"
            onChange={handleRouteTypeChange}
            value={routeType}
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
            onChange={handleHillReluctanceChange}
            value={hillReluctance}
          >
            <option value="1">Avoid at all costs</option>
            <option value="2">A reasonable route</option>
            <option value="3">Bring on the Hills!</option>
          </select>
        </div>
        <a href="#" className="clear-link" onClick={() => dispatch(clearRoute())}>
          Clear
        </a>
        <button type="submit" className="btn btn-success btn-update-route">
          {loading && <CircleNotchIcon className="loading-animation" />} Get Directions
        </button>
      </form>
    </div>
  );
};

export default Controls;
