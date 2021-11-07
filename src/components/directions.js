import appConfig from 'appConfig';
import Weather from './weather';

import {
  formatDistance,
  formatTime,
  formatElevation,
  getElevationGain,
  metersToFeet,
} from 'lib/helper';
import { getCenter } from 'lib/map';

const Directions = ({
  directions,
  startAddress,
  endAddress,
  startLocation,
  endLocation,
  distance,
  elevationProfile,
  isMobile,
  mobileView,
  height,
}) => {
  const getDirections = () => {
    if (!directions) {
      return '';
    }

    const directionsList = directions.reduce((memo, direction, idx) => {
      if (direction[1] !== 'nameless') {
        memo.push(
          <li key={idx}>
            <b>{direction[0]}</b> on <b>{direction[1]}</b>
          </li>
        );
      }

      return memo;
    }, []);

    directionsList.push(
      <li key="final">
        <b>arrive</b> at <b>{endAddress}</b>
      </li>
    );

    const location = getCenter(startLocation, endLocation);

    return (
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
          <Weather lat={location.lat} lng={location.lng} />
        </div>

        <h3 className="d-none d-print-block">Turn by Turn Directions</h3>
        <ul className="directions-list">{directionsList}</ul>
        <a href="#" className="d-print-none" onClick={window.print}>
          <small>Print this map to view your route offline.</small>
        </a>
      </div>
    );
  };

  return (
    <div
      className="directions"
      hidden={isMobile && mobileView !== 'directions'}
      style={{ height: height ? `${height}px` : 'auto' }}
    >
      {getDirections()}

      <div className="disclaimer">
        We offer no guarantee regarding roadway conditions or safety of the proposed
        routes. Use your best judgment when choosing a route. Obey all vehicle code
        provisions.
      </div>
      <a className="disclaimer" href={appConfig.ABOUT_LINK_URL}>
        {appConfig.ABOUT_LINK_TITLE}
      </a>
    </div>
  );
};

export default Directions;
