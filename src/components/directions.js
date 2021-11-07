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
            <div className="stats">
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
    </>
  );
};

export default Directions;
