// Thin wrapper over Ferrostar's NavigationSession (Rust core compiled to wasm):
// snapping, step advance, trigger distances and off-route detection come from
// Ferrostar. Reroute policy (when to re-request the Bikesy backend) lives here,
// because the web SDK leaves rerouting to the app.
//
// This file never imports `@stadiamaps/ferrostar`: Ferrostar is loaded on demand
// (dynamic import when the rider taps Start ride) and passed in, so the module is
// SSR-safe and can be tested with a fake session:
//
//   const ferrostar = await import('@stadiamaps/ferrostar');
//   const navigator = new Navigator(ferrostar, route);

export const NAV_CONFIG = {
  waypointAdvance: { WaypointWithinRange: 30 },
  // Ferrostar 0.58 flips the snapped-exit "reached the end" flag on every fix inside the
  // entry radius, so the exit is only checked on alternate fixes. A rider who leaves the
  // radius with the flag off never advances, and the banner freezes on an old maneuver.
  // Simulated rides at 18 km/h, 1 Hz, with entry 15 m: 62% completed with 3 m of GPS
  // noise, 36% with 6 m. Entry 25 m gives the exit more fixes to land on, and the fallback
  // advances once the rider is 35 m from the step line (the off-route distance, so clearly
  // past the step end rather than noise). That completes 99.7-100% of rides at 0-10 m
  // noise and 12-30 km/h, with the same early advances as entry 25 m alone.
  stepAdvanceCondition: {
    OrAdvanceConditions: {
      conditions: [
        {
          DistanceEntryAndSnappedExit: {
            distanceToEndOfStep: 25,
            distanceAfterEndStep: 8,
            minimumHorizontalAccuracy: 30,
            hasReachedEndOfCurrentStep: false,
          },
        },
        {
          DistanceFromStep: {
            distance: 35,
            minimumHorizontalAccuracy: 30,
            calculationPolicy: 'Always',
          },
        },
      ],
    },
  },
  arrivalStepAdvanceCondition: {
    DistanceToEndOfStep: { distance: 20, minimumHorizontalAccuracy: 40 },
  },
  // Bike paths often run 10-20 m beside a road; 35 m keeps us from flagging the
  // parallel road while still catching a wrong turn quickly.
  routeDeviationTracking: {
    StaticThreshold: { minimumHorizontalAccuracy: 40, maxAcceptableDeviation: 35 },
  },
  snappedLocationCourseFiltering: 'SnapToRoute',
};

// Off route continuously for this long (and not a lone GPS spike) before rerouting.
export const REROUTE_AFTER_MS = 3000;
// Minimum gap between reroute attempts, so a failing request doesn't hammer the backend.
export const REROUTE_RETRY_MS = 8000;

// fix: { lat, lng, accuracy, course, speed, timestamp } as emitted by DeviceLocation
// and Simulator. Course is degrees (or null), speed is m/s (or null).
export function toUserLocation({
  lat,
  lng,
  accuracy = 5,
  course = null,
  speed = null,
  timestamp = Date.now(),
}) {
  return {
    coordinates: { lat, lng },
    horizontalAccuracy: accuracy,
    // Wrapped into 0-359: noisy courses just north of 0 would otherwise go negative.
    courseOverGround:
      course == null
        ? null
        : { degrees: ((Math.round(course) % 360) + 360) % 360, accuracy: 10 },
    timestamp,
    speed: speed == null ? null : { value: speed, accuracy: null },
  };
}

export function isOffRoute(tripState) {
  const dev = tripState?.Navigating?.deviation;
  return (
    !!dev && dev !== 'NoDeviation' && 'CompletelyOffRoute' in (dev.Deviation?.kind ?? {})
  );
}

export class Navigator {
  // ferrostar: the loaded `@stadiamaps/ferrostar` module (only NavigationSession is used).
  // route: a Ferrostar Route, e.g. from RouteAdapter.parseResponse on the backend's
  // `nav_route`.
  constructor(ferrostar, route, config = NAV_CONFIG) {
    this.route = route;
    this.session = new ferrostar.NavigationSession(route, config);
    this.navState = null;
    this.offRouteSince = null;
    this.furthest = 0; // metres of the route covered at the furthest point reached
  }

  start(location) {
    this.navState = this.session.getInitialState(toUserLocation(location));
    this.noteProgress();
    return this.tripState;
  }

  // Feed a new fix; returns the new trip state (see Ferrostar's TripState:
  // { Navigating } | { Complete } | { Idle }). Null once the navigator is freed.
  update(location) {
    if (!this.session) return null;
    this.navState = this.session.updateUserLocation(
      toUserLocation(location),
      this.navState,
    );
    this.noteProgress();
    const t = this.tripState;
    const off = isOffRoute(t);
    if (off && this.offRouteSince == null) {
      this.offRouteSince = location.timestamp ?? Date.now();
    }
    if (!off) this.offRouteSince = null;
    return t;
  }

  get tripState() {
    return this.navState?.tripState ?? null;
  }

  get offRoute() {
    return isOffRoute(this.tripState);
  }

  // Progress is the route length less Ferrostar's distance remaining; keep the furthest.
  noteProgress() {
    const remaining = this.tripState?.Navigating?.progress?.distanceRemaining;
    if (remaining != null) {
      this.furthest = Math.max(this.furthest, this.route.distance - remaining);
    }
  }

  // Distance ridden on this route (m): the furthest point reached, and all of it once
  // the trip is complete. Ferrostar's own total sums the snapped position's movement, so
  // GPS jitter along the route inflates it (+27% at 6 m of noise); progress along the
  // route can't be. The caller adds this to its running total when it swaps in a
  // rerouted session.
  get distanceAlongRoute() {
    return this.tripState?.Complete ? this.route.distance : this.furthest;
  }

  // Off route continuously for `ms` (and not a lone GPS spike). `now` is in the same
  // clock as the fix timestamps passed to update() (the sim clock when simulating).
  shouldReroute(now, ms = REROUTE_AFTER_MS) {
    return this.offRouteSince != null && now - this.offRouteSince >= ms;
  }

  free() {
    this.session?.free();
    this.session = null;
  }
}
