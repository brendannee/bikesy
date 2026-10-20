import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  NAV_CONFIG,
  Navigator,
  REROUTE_AFTER_MS,
  REROUTE_RETRY_MS,
  isOffRoute,
  toUserLocation,
} from './navigator.js';

// A stand-in for Ferrostar's NavigationSession. Each call reports the next trip state
// from `script` (a function of the user location) so tests control deviation.
function fakeFerrostar(script = () => onRoute()) {
  const created = [];
  class NavigationSession {
    constructor(route, config) {
      this.route = route;
      this.config = config;
      this.calls = [];
      this.freed = false;
      created.push(this);
    }
    getInitialState(location) {
      this.calls.push(['getInitialState', location]);
      return { tripState: script(location), initial: true };
    }
    updateUserLocation(location, state) {
      this.calls.push(['updateUserLocation', location, state]);
      return { tripState: script(location) };
    }
    free() {
      this.freed = true;
    }
  }
  return { ferrostar: { NavigationSession }, created };
}

const navigating = (deviation, extra = {}) => ({
  Navigating: { deviation, summary: { snappedDistanceTraveled: 0 }, ...extra },
});
const onRoute = (extra) => navigating('NoDeviation', extra);
const offStep = () =>
  navigating({ Deviation: { kind: { OffStepOnRoute: { deviationFromStepLine: 20 } } } });
const offRoute = () =>
  navigating({
    Deviation: { kind: { CompletelyOffRoute: { deviationFromRouteLine: 80 } } },
  });

// Trip states by fix: lng > 0 means "off route".
const offWhenEast = (location) => (location.coordinates.lng > 0 ? offRoute() : onRoute());
const fix = (timestamp, lng = 0) => ({ lat: 38.9, lng, timestamp });

test('NAV_CONFIG keeps the thresholds tuned on real rides', () => {
  assert.equal(
    NAV_CONFIG.routeDeviationTracking.StaticThreshold.maxAcceptableDeviation,
    35,
  );
  assert.equal(
    NAV_CONFIG.routeDeviationTracking.StaticThreshold.minimumHorizontalAccuracy,
    40,
  );
  assert.equal(NAV_CONFIG.waypointAdvance.WaypointWithinRange, 30);
  // Snapped exit as the main rule, with a fallback for when Ferrostar never checks it.
  const [snappedExit, fallback] =
    NAV_CONFIG.stepAdvanceCondition.OrAdvanceConditions.conditions;
  assert.deepEqual(snappedExit.DistanceEntryAndSnappedExit, {
    distanceToEndOfStep: 25,
    distanceAfterEndStep: 8,
    minimumHorizontalAccuracy: 30,
    hasReachedEndOfCurrentStep: false,
  });
  assert.deepEqual(fallback.DistanceFromStep, {
    distance: 35,
    minimumHorizontalAccuracy: 30,
    calculationPolicy: 'Always',
  });
  assert.deepEqual(NAV_CONFIG.arrivalStepAdvanceCondition, {
    DistanceToEndOfStep: { distance: 20, minimumHorizontalAccuracy: 40 },
  });
  assert.equal(NAV_CONFIG.snappedLocationCourseFiltering, 'SnapToRoute');
  assert.equal(REROUTE_AFTER_MS, 3000);
  assert.equal(REROUTE_RETRY_MS, 8000);
});

test('the injected Ferrostar module builds the session with the route and NAV_CONFIG', () => {
  const { ferrostar, created } = fakeFerrostar();
  const route = { steps: [] };
  const nav = new Navigator(ferrostar, route);
  assert.equal(nav.route, route);
  assert.equal(created.length, 1);
  assert.equal(created[0].route, route);
  assert.equal(created[0].config, NAV_CONFIG);
});

test('toUserLocation: Ferrostar shape with defaults, rounded and wrapped course, optional speed', () => {
  const loc = toUserLocation({ lat: 38.9, lng: -120, timestamp: 5 });
  assert.deepEqual(loc, {
    coordinates: { lat: 38.9, lng: -120 },
    horizontalAccuracy: 5,
    courseOverGround: null,
    timestamp: 5,
    speed: null,
  });
  const moving = toUserLocation({
    lat: 1,
    lng: 2,
    accuracy: 12,
    course: 89.6,
    speed: 4.2,
    timestamp: 7,
  });
  assert.equal(moving.horizontalAccuracy, 12);
  assert.deepEqual(moving.courseOverGround, { degrees: 90, accuracy: 10 });
  assert.deepEqual(moving.speed, { value: 4.2, accuracy: null });
  // Whole-degree courses stay in 0-359, including noisy ones just either side of north.
  assert.equal(
    toUserLocation({ lat: 1, lng: 2, course: 359.6 }).courseOverGround.degrees,
    0,
  );
  assert.equal(
    toUserLocation({ lat: 1, lng: 2, course: -2 }).courseOverGround.degrees,
    358,
  );
  assert.equal(toUserLocation({ lat: 1, lng: 2, course: 0 }).courseOverGround.degrees, 0);
  assert.equal(typeof toUserLocation({ lat: 1, lng: 2 }).timestamp, 'number');
});

test('isOffRoute: only a complete deviation counts, not drifting off one step', () => {
  assert.equal(isOffRoute(offRoute()), true);
  assert.equal(isOffRoute(onRoute()), false);
  assert.equal(isOffRoute(offStep()), false);
  assert.equal(isOffRoute({ Complete: {} }), false);
  assert.equal(isOffRoute({ Idle: {} }), false);
  assert.equal(isOffRoute(null), false);
});

test('start and update pass converted locations and the previous nav state through', () => {
  const { ferrostar, created } = fakeFerrostar();
  const nav = new Navigator(ferrostar, {});
  const first = nav.start({ lat: 38.9, lng: -120, accuracy: 50, timestamp: 1 });
  assert.deepEqual(first, onRoute());
  assert.equal(nav.tripState, first);
  const [name, location] = created[0].calls[0];
  assert.equal(name, 'getInitialState');
  assert.equal(location.horizontalAccuracy, 50);
  assert.deepEqual(location.coordinates, { lat: 38.9, lng: -120 });

  const second = nav.update({
    lat: 38.9001,
    lng: -120,
    course: 10,
    speed: 5,
    timestamp: 2,
  });
  assert.deepEqual(second, onRoute());
  const [updateName, , state] = created[0].calls[1];
  assert.equal(updateName, 'updateUserLocation');
  assert.equal(state.initial, true); // the nav state from start()
});

test('shouldReroute: only after 3 s continuously off route', () => {
  const { ferrostar } = fakeFerrostar(offWhenEast);
  const nav = new Navigator(ferrostar, {});
  nav.start(fix(0));
  assert.equal(nav.shouldReroute(0), false);

  nav.update(fix(1000, 1)); // first off-route fix
  assert.equal(nav.offRoute, true);
  assert.equal(nav.shouldReroute(1000), false);
  nav.update(fix(2000, 1));
  assert.equal(nav.shouldReroute(2000), false);
  nav.update(fix(3999, 1));
  assert.equal(nav.shouldReroute(3999), false); // 2.999 s
  nav.update(fix(4000, 1));
  assert.equal(nav.shouldReroute(4000), true); // exactly 3 s
  assert.equal(nav.shouldReroute(9000), true);
});

test('shouldReroute: getting back on route resets the clock', () => {
  const { ferrostar } = fakeFerrostar(offWhenEast);
  const nav = new Navigator(ferrostar, {});
  nav.start(fix(0));
  nav.update(fix(1000, 1));
  nav.update(fix(3000, 1));
  assert.equal(nav.shouldReroute(3500), false);
  nav.update(fix(3500, 1));
  assert.equal(nav.shouldReroute(4000), true);

  nav.update(fix(4500, 0)); // back on the route
  assert.equal(nav.offRoute, false);
  assert.equal(nav.offRouteSince, null);
  assert.equal(nav.shouldReroute(99_000), false);

  // Off again later: the 3 s count starts from this new departure, not the old one.
  nav.update(fix(6000, 1));
  assert.equal(nav.shouldReroute(8999), false);
  assert.equal(nav.shouldReroute(9000), true);
});

test('shouldReroute: a lone GPS spike does not trigger a reroute', () => {
  const { ferrostar } = fakeFerrostar(offWhenEast);
  const nav = new Navigator(ferrostar, {});
  nav.start(fix(0));
  nav.update(fix(1000, 0));
  nav.update(fix(2000, 1)); // spike
  nav.update(fix(3000, 0));
  nav.update(fix(4000, 0));
  assert.equal(nav.shouldReroute(5000), false);
});

test('shouldReroute: drifting off the current step but still on the route is not off route', () => {
  const { ferrostar } = fakeFerrostar(() => offStep());
  const nav = new Navigator(ferrostar, {});
  nav.start(fix(0));
  for (let t = 1000; t <= 10_000; t += 1000) nav.update(fix(t));
  assert.equal(nav.shouldReroute(10_000), false);
});

test('shouldReroute: the delay can be overridden and uses the fix clock', () => {
  const { ferrostar } = fakeFerrostar(offWhenEast);
  const nav = new Navigator(ferrostar, {});
  nav.start(fix(0));
  // Simulated rides run on the simulator clock (timestamps in the fixes).
  nav.update(fix(1_000_000, 1));
  assert.equal(nav.shouldReroute(1_000_500, 500), true);
  assert.equal(nav.shouldReroute(1_000_499, 500), false);
});

test('an off-route fix without a timestamp falls back to the wall clock', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 50_000 });
  const { ferrostar } = fakeFerrostar(offWhenEast);
  const nav = new Navigator(ferrostar, {});
  nav.start({ lat: 38.9, lng: 0 });
  nav.update({ lat: 38.9, lng: 1 });
  assert.equal(nav.offRouteSince, 50_000);
});

test('snappedDistanceTraveled: this session distance, 0 until navigating', () => {
  let traveled = 0;
  const { ferrostar } = fakeFerrostar(() =>
    onRoute({ summary: { snappedDistanceTraveled: traveled } }),
  );
  const nav = new Navigator(ferrostar, {});
  assert.equal(nav.snappedDistanceTraveled, 0);
  nav.start(fix(0));
  traveled = 412.5;
  nav.update(fix(1000));
  assert.equal(nav.snappedDistanceTraveled, 412.5);
});

test('free releases the session once and later fixes are ignored', () => {
  const { ferrostar, created } = fakeFerrostar();
  const nav = new Navigator(ferrostar, {});
  nav.start(fix(0));
  nav.free();
  assert.equal(created[0].freed, true);
  assert.equal(nav.update(fix(1000)), null);
  nav.free(); // harmless
});
