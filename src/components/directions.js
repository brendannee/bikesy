import { useData } from 'components/app';
import Card from 'components/Card';
import Weather from 'components/weather';

import {
  formatDistance,
  formatTime,
  formatElevation,
  getElevationGain,
  metersToFeet,
} from 'lib/helper';
import { getCenter } from 'lib/map';

const Directions = () => {
  const {
    directions,
    startAddress,
    endAddress,
    startLocation,
    endLocation,
    distance,
    elevationProfile,
  } = useData();

  const filteredDirections = directions?.filter((item) => item[1] !== 'nameless');
  const location = getCenter(startLocation, endLocation);

  return (
    <>
      {directions && (
        <Card>
          <div>
            <h3>
              Directions to{' '}
              <b>
                {endAddress}
                <span className="d-none d-print-inline"> from {startAddress}</span>
              </b>
            </h3>

            <div className="stats">
              <h3 className="d-none d-print-block">Ride Summary</h3>

              <b>
                {formatDistance(distance)}, {formatTime(distance)}
              </b>

              <br />

              {elevationProfile &&
                `${formatElevation(
                  metersToFeet(getElevationGain(elevationProfile))
                )} of total climbing`}

              {location && <Weather lat={location.lat} lng={location.lng} />}
            </div>

            <h3 className="d-none d-print-block">Turn by Turn Directions</h3>

            <ul className="directions-list">
              {filteredDirections.map((step) => (
                <li key={step[0]}>
                  <b>{step[0]}</b> on <b>{step[1]}</b>
                </li>
              ))}

              <li>
                <b>arrive</b> at <b>{endAddress}</b>
              </li>
            </ul>

            <a href="#" className="d-print-none" onClick={window.print}>
              <small>Print this map to view your route offline.</small>
            </a>
          </div>
        </Card>
      )}

      <Card>
        <Card.Content>
          <div className="disclaimer">
            We offer no guarantee regarding roadway conditions or safety of the proposed
            routes. Use your best judgment when choosing a route. Obey all vehicle code
            provisions.
          </div>
          <a className="disclaimer" href="https://bikesy.com/about">
            About Bikesy
          </a>
        </Card.Content>
      </Card>
    </>
  );
};

export default Directions;
