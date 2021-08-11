import { useState, useEffect } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch, faCrosshairs } from '@fortawesome/free-solid-svg-icons';

import { scenarioToComponents, componentsToScenario } from 'lib/scenarios';

const Controls = ({
  updateRoute,
  updateControls,
  mobileView,
  isMobile,
  startAddress,
  endAddress,
  scenario,
  clearRoute,
  loading,
}) => {
  const [routeType, setRouteType] = useState('3');
  const [hillReluctance, setHillReluctance] = useState('1');
  const [errorFields, setErrorFields] = useState([]);
  const [geolocationPending, setGeolocationPending] = useState(false);
  const [startAddressInput, setStartAddressInput] = useState('');
  const [endAddressInput, setEndAddressInput] = useState('');

  const processForm = (event) => {
    event.preventDefault();

    updateControls({
      startAddress: startAddressInput,
      endAddress: endAddressInput,
    });
    handleForm();
  };

  const handleStartAddressChange = (event) => {
    setStartAddressInput(event.target.value);
  };

  const handleEndAddressChange = (event) => {
    setEndAddressInput(event.target.value);
  };

  const handleRouteTypeChange = (event) => {
    const scenario = componentsToScenario({
      routeType: event.target.value,
      hillReluctance,
    });

    updateControls({ scenario });
    handleForm();
  };

  const handleHillReluctanceChange = (event) => {
    const scenario = componentsToScenario({
      routeType,
      hillReluctance: event.target.value,
    });

    updateControls({ scenario });
    handleForm();
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

  const handleForm = () => {
    const errorFields = validateForm();

    if (errorFields.length) {
      setErrorFields(errorFields);
      return false;
    }

    setErrorFields([]);

    return updateRoute(startAddressInput, endAddressInput);
  };

  const validateForm = () => {
    const errorFields = [];
    if (!startAddress) {
      errorFields.push('startAddress');
    }

    if (!endAddress) {
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

  useEffect(() => {
    if (startAddress !== startAddressInput) {
      setStartAddressInput(startAddress);
    }
  }, [startAddress]);

  useEffect(() => {
    if (endAddress !== endAddressInput) {
      setEndAddressInput(endAddress);
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
          <label className="control-label">Start Location</label>
          <div className="start-icon" title="Start Location">
            S
          </div>
          <input
            type="text"
            value={startAddressInput}
            onChange={handleStartAddressChange}
            className={classNames('form-control', {
              'is-invalid': _.includes(errorFields, 'startAddress'),
            })}
            placeholder={getStartAddressPlaceholder()}
          />
          <FontAwesomeIcon icon={faCircleNotch} spin className="loading-animation" />
          <a
            className="btn btn-light btn-geolocation"
            title="Use my location"
            onClick={getGeolocation}
          >
            <FontAwesomeIcon icon={faCrosshairs} />
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
            onChange={handleEndAddressChange}
            className={classNames('form-control', {
              'is-invalid': _.includes(errorFields, 'endAddress'),
            })}
            placeholder="End Address"
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
        <a href="#" className="clear-link" onClick={clearRoute}>
          Clear
        </a>
        <button type="submit" className="btn btn-success btn-update-route">
          {loading && <FontAwesomeIcon icon={faCircleNotch} spin />} Get Directions
        </button>
      </form>
    </div>
  );
};

export default Controls;
