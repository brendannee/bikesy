import classNames from 'classnames';
import { useSelector } from 'react-redux';

import ManeuverIcon from './ManeuverIcon';

// The next turn, with a "Then" strip when the one after follows closely. Turns red
// while the rider is off route.
const NavBanner = () => {
  const banner = useSelector((state) => state.navigation.banner);
  const offRoute = useSelector((state) => state.navigation.offRoute);
  const status = useSelector((state) => state.navigation.status);

  if (offRoute) {
    return (
      <div className="nav-banner off-route" role="status">
        <div className="nav-banner-main">
          <ManeuverIcon type="turn" modifier="uturn" size={56} />
          <div className="nav-banner-text">
            <div className="nav-banner-distance">Off route</div>
            <div className="nav-banner-road">
              {status === 'rerouting'
                ? 'Finding a new route…'
                : 'Head back to the orange line'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!banner) {
    return null;
  }

  return (
    <div
      className={classNames('nav-banner', { arrive: banner.type === 'arrive' })}
      role="status"
    >
      <div className="nav-banner-main">
        <ManeuverIcon type={banner.type} modifier={banner.modifier} size={60} />
        <div className="nav-banner-text">
          <div className="nav-banner-distance">{banner.distance}</div>
          <div className="nav-banner-road">{banner.text}</div>
        </div>
      </div>
      {banner.then && (
        <div className="nav-banner-then">
          <span>Then</span>
          <ManeuverIcon
            type={banner.then.type}
            modifier={banner.then.modifier}
            size={22}
          />
          <span>{banner.then.text}</span>
        </div>
      )}
    </div>
  );
};

export default NavBanner;
