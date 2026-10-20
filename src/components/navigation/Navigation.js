import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import appConfig from '../../appConfig';
import { trackEvent } from '../../lib/analytics';
import { getRoute } from '../../lib/api';
import { getMap } from '../../lib/map';
import { keepScreenOn, speech } from '../../lib/navigation/device';
import { loadFerrostar } from '../../lib/navigation/ferrostar';
import { sentence } from '../../lib/navigation/format';
import { devFlags, navigationEnabled } from '../../lib/navigation/flags';
import { enableCompass } from '../../lib/navigation/heading';
import {
  dismissNavigationError,
  endNavigation,
  isNavigating,
  setMuted,
  startNavigation,
  updateNavigation,
} from '../../redux/slices/navigation';
import circleNotchIcon from '../icons/circle-notch-solid.svg';
import ArrivalCard from './ArrivalCard';
import DebugReadout from './DebugReadout';
import NavBanner from './NavBanner';
import NavToast from './NavToast';
import SpokenCaption from './SpokenCaption';
import StepsSheet from './StepsSheet';
import TripBar from './TripBar';

const voiceIcon = (on) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
    {on ? (
      <path
        d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    ) : (
      <path
        d="M16 9l6 6M22 9l-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    )}
  </svg>
);

const overviewIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z M9 4v14M15 6v14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

// The ride controller, like Ferrostar, is only downloaded when a ride starts, so
// regions and visitors that never navigate don't load it.
const loadRideController = () => import('../../lib/navigation/controller');

function startErrorMessage(error) {
  // fetch() rejects with a TypeError when the network or server is unreachable.
  if (error instanceof TypeError && /fetch|load failed|network/i.test(error.message)) {
    return "Couldn't reach the routing service. Check your connection and try again.";
  }
  const reason = sentence(error?.message ?? error);
  return error?.fromRider
    ? `Couldn't find a route from your location. ${reason}`
    : `Couldn't start navigation. ${reason}`;
}

// Turn-by-turn navigation: the Start ride button on the planning screen, then the
// navigation screens over the full-screen map. The ride itself runs in a
// RideController, which publishes what to show to the navigation slice.
const Navigation = ({ isMobile }) => {
  const dispatch = useDispatch();
  const path = useSelector((state) => state.search.path);
  const startLocation = useSelector((state) => state.search.startLocation);
  const endLocation = useSelector((state) => state.search.endLocation);
  const scenario = useSelector((state) => state.search.scenario);
  const status = useSelector((state) => state.navigation.status);
  const error = useSelector((state) => state.navigation.error);
  const following = useSelector((state) => state.navigation.following);
  const muted = useSelector((state) => state.navigation.muted);

  // Read from the page URL once mounted (?nav=1, ?sim=1, ?debug=1).
  const [flags, setFlags] = useState(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  const rideRef = useRef(null);
  // Identifies the current Start ride tap, so a cancelled start can't carry on.
  const attemptRef = useRef(null);

  useEffect(() => {
    const search = window.location.search;
    setFlags({
      enabled: navigationEnabled(appConfig.NAVIGATION_ENABLED, search),
      ...devFlags(search),
    });
    // Leaving the page mid-ride stops GPS, timers and the wake lock.
    return () => rideRef.current?.end();
  }, []);

  const finish = (error = null) => {
    attemptRef.current = null;
    rideRef.current?.end();
    rideRef.current = null;
    setStepsOpen(false);
    dispatch(endNavigation({ error }));
  };

  // A changed or cleared plan cancels a ride that is still starting.
  useEffect(() => {
    if (!path && status === 'starting') {
      finish();
    }
  }, [path]);

  const startRide = () => {
    // Everything that needs the tap happens here, before anything async: iOS only shows
    // the motion (compass) permission prompt and unlocks speech from a user gesture,
    // and Safari only grants the screen wake lock from one.
    speech.reset();
    speech.unlock();
    speech.setEnabled(!muted);
    keepScreenOn(true);
    if (!flags.simulate) {
      enableCompass();
    }

    const attempt = {};
    attemptRef.current = attempt;
    dispatch(startNavigation());
    // Start downloading the engine now; the controller picks up the same request.
    loadFerrostar().catch(() => {});
    loadRideController()
      .then(({ RideController }) => {
        if (attemptRef.current !== attempt) return;
        const ride = new RideController({
          map: getMap(),
          scenario,
          simulate: flags.simulate,
          sim: { warp: flags.warp, noise: flags.noise },
          getNavRoute: (from, to, { signal }) =>
            getRoute(from, to, scenario, { signal, nav: true }),
          publish: (patch) => dispatch(updateNavigation(patch)),
          track: trackEvent,
        });
        rideRef.current = ride;
        return ride.start({ start: startLocation, end: endLocation });
      })
      .catch((error) => {
        // Cancelled, or replaced by another ride.
        if (attemptRef.current !== attempt) return;
        console.error(error);
        finish(startErrorMessage(error));
      });
  };

  const toggleMute = () => {
    speech.setEnabled(muted);
    dispatch(setMuted(!muted));
  };

  const getDebugLines = useCallback(() => rideRef.current?.debugLines(), []);

  if (!flags?.enabled) {
    return null;
  }

  if (!isNavigating(status)) {
    if (!isMobile || !path) {
      return null;
    }

    const starting = status === 'starting';
    return (
      <div className="nav-start d-print-none">
        {error && (
          <div className="nav-start-error" role="alert">
            <span>{error}</span>
            <button
              className="close-box"
              onClick={() => dispatch(dismissNavigationError())}
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        )}
        <div className="nav-start-buttons">
          <button
            className="btn btn-success btn-lg nav-start-button"
            onClick={startRide}
            disabled={starting}
          >
            {starting && (
              <img
                className="loading-animation"
                src={circleNotchIcon?.src ?? circleNotchIcon}
                alt=""
                aria-hidden="true"
              />
            )}
            {starting ? 'Starting…' : 'Start ride'}
          </button>
          {starting && (
            <button className="btn btn-light btn-lg" onClick={() => finish()}>
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'arrived') {
    return (
      <div className="navigation d-print-none">
        <ArrivalCard onDone={() => finish()} />
      </div>
    );
  }

  return (
    <div className="navigation d-print-none">
      <div className="nav-top">
        <NavBanner />
        <SpokenCaption />
        {flags.debug && <DebugReadout getLines={getDebugLines} />}
      </div>
      <div className="nav-bottom">
        <NavToast />
        <div className="nav-map-controls">
          {!following && (
            <button className="nav-recenter" onClick={() => rideRef.current?.recenter()}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 3l7 18-7-4-7 4z" fill="currentColor" />
              </svg>
              Recenter
            </button>
          )}
          <div className="nav-map-buttons">
            <button
              className="nav-round-button"
              onClick={toggleMute}
              aria-label={muted ? 'Turn voice on' : 'Turn voice off'}
              aria-pressed={muted}
            >
              {voiceIcon(!muted)}
            </button>
            <button
              className="nav-round-button"
              onClick={() => rideRef.current?.overview()}
              aria-label="Route overview"
            >
              {overviewIcon}
            </button>
          </div>
        </div>
        <TripBar
          onSteps={() => setStepsOpen(true)}
          onEnd={() => finish()}
          onSimSpeed={(delta) => rideRef.current?.adjustSimSpeed(delta)}
          onSimPause={() => rideRef.current?.toggleSimPause()}
          onMissTurn={() => rideRef.current?.missNextTurn()}
        />
      </div>
      {stepsOpen && <StepsSheet onClose={() => setStepsOpen(false)} />}
    </div>
  );
};

export default Navigation;
