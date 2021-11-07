import { useState, useEffect } from 'react';
import _ from 'lodash';
import styled from 'styled-components';

import { useData } from 'components/app';
import Card from 'components/Card';

import { scenarioToComponents, componentsToScenario } from 'lib/scenarios';

const InputGroup = styled.div`
  overflow: hidden;
  position: relative;
  & + & {
    border-top: 1px solid #ddd;
  }
`;

const Input = styled.input`
  border: none;
  padding: 0.5rem 1rem;
  width: 100%;
`;

const Label = styled.label`
  height: 0;
  left: -99999px;
  position: absolute;
  top: -99999px;
  width: 0;
`;

const Controls = () => {
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
    <Card>
      <form onSubmit={processForm}>
        <InputGroup>
          <Label>Start Location</Label>
          <Input
            type="text"
            value={startAddressInput}
            onChange={handleStartAddressChange}
            placeholder="595 Oak St"
          />

          {/* <FontAwesomeIcon icon={faCircleNotch} spin className="loading-animation" /> */}
          {/* <a title="Use my location" onClick={getGeolocation}>
              <FontAwesomeIcon icon={faCrosshairs} />
            </a> */}
        </InputGroup>

        <InputGroup>
          <Label>End Location</Label>
          <Input
            type="text"
            value={endAddressInput}
            onChange={handleEndAddressChange}
            placeholder="665 Balboa St"
          />
        </InputGroup>
        {/* <button type="submit">
          {loading && <FontAwesomeIcon icon={faCircleNotch} spin />} Get Directions
        </button> */}
      </form>
    </Card>
  );
};

export default Controls;
