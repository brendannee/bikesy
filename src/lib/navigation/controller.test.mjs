import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NO_NAV_ROUTE_MESSAGE, RideController } from './controller.js';
import { destination, distance, pointToSegment } from './geo.js';
import { speech } from './device.js';
import { compass } from './heading.js';

// --- Fakes ------------------------------------------------------------------------

// Browser globals the camera, puck and wake lock touch. No animation frames run.
function stubBrowser(t) {
  class Marker {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    setRotation() {}
    remove() {}
  }
  class LngLatBounds {
    extend() {}
  }
  const stubs = {
    mapboxgl: { Marker, LngLatBounds },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    document: {
      createElement: () => ({}),
      addEventListener() {},
      removeEventListener() {},
      visibilityState: 'visible',
    },
    navigator: {
      geolocation: { watchPosition: () => 7, clearWatch() {} },
    },
  };
  for (const [name, value] of Object.entries(stubs)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, {
      value,
      configurable: true,
      writable: true,
    });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  }
  speech.reset();
}

// Just enough of a Mapbox map for the camera and the route layers.
function fakeMap() {
  const sources = new Map();
  const layers = new Set();
  return {
    sources,
    layers,
    on() {},
    off() {},
    getStyle: () => ({ layers: [] }),
    addSource: (id) => sources.set(id, { setData() {} }),
    getSource: (id) => sources.get(id),
    removeSource: (id) => sources.delete(id),
    addLayer: (layer) => layers.add(layer.id),
    getLayer: (id) => layers.has(id),
    removeLayer: (id) => layers.delete(id),
    getContainer: () => ({ clientWidth: 390, clientHeight: 800 }),
    getBearing: () => 0,
    easeTo() {},
    jumpTo() {},
    setPadding() {},
    fitBounds() {},
  };
}

const START = [38.9, -120];
const point = ([lat, lng]) => ({ lat, lng });

// A Ferrostar-shaped route from `from` heading north for `meters`.
function route(from, meters) {
  const end = destination(from, 0, meters);
  return {
    distance: meters,
    geometry: [point(from), point(end)],
    steps: [
      {
        distance: meters,
        geometry: [point(from), point(end)],
        instruction: 'Bike north on Main Street.',
        roadName: 'Main Street',
        visualInstructions: [
          { primaryContent: { text: 'Your destination', maneuverType: 'arrive' } },
        ],
      },
      { distance: 0, geometry: [point(end), point(end)], instruction: 'Arrive.' },
    ],
  };
}

// Stands in for Ferrostar: snaps to the route line, reports off route beyond 35 m and
// completes within 5 m of the end. nav_route carries the route as is.
function fakeFerrostar() {
  const sessions = [];
  class NavigationSession {
    constructor(route) {
      if (route.broken) throw new Error('Ferrostar rejected the route');
      this.route = route;
      this.freed = false;
      sessions.push(this);
    }
    getInitialState(location) {
      return this.state(location);
    }
    updateUserLocation(location) {
      return this.state(location);
    }
    state(location) {
      assert.equal(this.freed, false, 'used after free()');
      const p = [location.coordinates.lat, location.coordinates.lng];
      const [a, b] = this.route.geometry.map((c) => [c.lat, c.lng]);
      const { dist, t } = pointToSegment(p, a, b);
      const total = this.route.distance;
      const along = t * total;
      if (total - along < 5 && dist < 35) {
        return {
          tripState: { Complete: { summary: { snappedDistanceTraveled: along } } },
        };
      }
      const snapped = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      return {
        tripState: {
          Navigating: {
            deviation:
              dist > 35
                ? {
                    Deviation: {
                      kind: { CompletelyOffRoute: { deviationFromRouteLine: dist } },
                    },
                  }
                : 'NoDeviation',
            userLocation: location,
            snappedUserLocation: {
              coordinates: point(snapped),
              courseOverGround: { degrees: 0 },
            },
            remainingSteps: this.route.steps,
            visualInstruction:
              dist > 35 ? undefined : this.route.steps[0].visualInstructions[0],
            spokenInstruction: null,
            progress: {
              distanceToNextManeuver: total - along,
              distanceRemaining: total - along,
              durationRemaining: (total - along) / 5,
            },
            summary: { snappedDistanceTraveled: along },
          },
        },
      };
    }
    free() {
      this.freed = true;
    }
  }
  class RouteAdapter {
    parseResponse(bytes) {
      const navRoute = JSON.parse(new TextDecoder().decode(bytes));
      if (navRoute.code !== 'Ok') throw new Error('bad route');
      return [navRoute.route];
    }
  }
  return { ferrostar: { NavigationSession, RouteAdapter }, sessions };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
}

// A controller with fakes everywhere. getNavRoute answers with a route north from
// wherever it is asked to start, unless a test queues its own responses.
function setup(
  t,
  { simulate = true, locate, meters = 1000, responses = [], loadEngine } = {},
) {
  const { ferrostar, sessions } = fakeFerrostar();
  const requests = [];
  const updates = [];
  const events = [];
  const map = fakeMap();
  const ride = new RideController({
    map,
    scenario: '1',
    simulate,
    locate,
    loadEngine: loadEngine ?? (async () => ferrostar),
    getNavRoute: (from, to, { signal }) => {
      requests.push({ from, to, signal });
      if (responses.length) return responses.shift();
      return Promise.resolve({
        nav_route: { code: 'Ok', route: route([from.lat, from.lng], meters) },
      });
    },
    publish: (patch) => updates.push(patch),
    track: (name, properties) => events.push({ name, properties }),
  });
  // Hooks run in order: end the ride before the browser globals go away.
  t.after(() => ride.end());
  stubBrowser(t);
  const state = () => Object.assign({}, ...updates);
  return { ride, map, sessions, requests, updates, events, state };
}

const fixAt = (p, timestamp, extra = {}) => ({
  lat: p[0],
  lng: p[1],
  accuracy: 5,
  course: 0,
  speed: 5,
  timestamp,
  ...extra,
});
// `meters` north of `from`, and `east` meters off to the side.
const along = (from, meters, east = 0) =>
  destination(destination(from, 0, meters), 90, east);

// --- Starting ---------------------------------------------------------------------

test('a simulated ride routes from the planned start without asking for a location', async (t) => {
  let located = 0;
  const { ride, requests, state, events, map } = setup(t, {
    locate: async () => (located++, null),
  });
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  ride.sim.stop();
  assert.equal(located, 0);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].from, point(START));
  assert.equal(state().status, 'navigating');
  assert.equal(state().banner.text, 'Your destination');
  assert.equal(state().trip.distanceLeft, '0.6 mi');
  assert.ok(map.layers.has('nav-route') && map.layers.has('nav-maneuver'));
  assert.deepEqual(events, [
    { name: 'nav_start', properties: { scenario: '1', distanceMeters: 1000 } },
  ]);
});

test('a rider more than 150 m from the planned start is routed from where they are', async (t) => {
  const here = along(START, -400);
  const { ride, requests } = setup(t, {
    simulate: false,
    locate: async () => fixAt(here, 1000),
  });
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  assert.deepEqual(requests[0].from, point(here));
});

test('a rider within 150 m of the planned start is routed from the planned start', async (t) => {
  const { ride, requests, state } = setup(t, {
    simulate: false,
    locate: async () => fixAt(along(START, -100), 1000),
  });
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  assert.deepEqual(requests[0].from, point(START));
  assert.equal(state().status, 'navigating');
});

test('with no fix in time, the ride starts from the planned start and checks the first fix', async (t) => {
  const { ride, requests, state } = setup(t, {
    simulate: false,
    locate: async () => null,
  });
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  assert.deepEqual(requests[0].from, point(START));
  assert.equal(state().status, 'navigating');
  // The first GPS fix is 400 m away: route from there.
  const here = along(START, -400, 50);
  ride.onFix(fixAt(here, 5000));
  assert.equal(requests.length, 2);
  assert.ok(distance([requests[1].from.lat, requests[1].from.lng], here) < 0.01);
  assert.equal(state().toast.text, 'Routing from your location…');
});

test('a backend without nav_route fails the start with a clear message', async (t) => {
  const { ride, map, events } = setup(t, {
    responses: [Promise.resolve({ path: ['legacy only'] })],
  });
  await assert.rejects(
    ride.start({ start: point(START), end: point(along(START, 1000)) }),
    { message: NO_NAV_ROUTE_MESSAGE },
  );
  ride.end();
  assert.equal(map.layers.size, 0);
  assert.deepEqual(events, []);
});

test('a failed route from where the rider is says so', async (t) => {
  const { ride } = setup(t, {
    simulate: false,
    locate: async () => fixAt([37.77, -122.42], 1000),
    responses: [Promise.reject(new Error('Location outside routing bounds'))],
  });
  await assert.rejects(
    ride.start({ start: point(START), end: point(along(START, 1000)) }),
    { message: 'Location outside routing bounds', fromRider: true },
  );
});

test('a refused location fails the start', async (t) => {
  const { ride, requests } = setup(t, {
    simulate: false,
    locate: async () => {
      throw new Error('Allow this site to use your location to navigate.');
    },
  });
  await assert.rejects(
    ride.start({ start: point(START), end: point(along(START, 1000)) }),
    /use your location/,
  );
  assert.equal(requests.length, 0);
});

// --- Riding, rerouting, arriving --------------------------------------------------

test('3 s off route reroutes from the rider, and totals carry across to arrival', async (t) => {
  const { ride, sessions, requests, events, state } = setup(t);
  const end = along(START, 1000);
  await ride.start({ start: point(START), end: point(end) });
  ride.sim.stop();
  const t0 = ride.sim.clock;

  // 300 m along the route, then 100 m off to the east.
  ride.onFix(fixAt(along(START, 300), t0 + 60000));
  assert.equal(state().offRoute, false);
  for (let s = 1; s <= 3; s++) {
    ride.onFix(fixAt(along(START, 300, 100), t0 + 60000 + s * 1000));
    assert.equal(state().offRoute, true);
    assert.equal(requests.length, 1, 'no reroute before 3 s off route');
  }
  const off = fixAt(along(START, 300, 100), t0 + 64000);
  ride.onFix(off);
  assert.equal(requests.length, 2);
  // The red banner says so; no "Rerouting…" notice on top of it.
  assert.equal(state().toast, undefined);
  assert.ok(
    distance([requests[1].from.lat, requests[1].from.lng], [off.lat, off.lng]) < 0.01,
  );
  assert.equal(state().status, 'rerouting');
  // Still off route while the request is in flight: no second request.
  ride.onFix(fixAt(along(START, 300, 110), t0 + 65000));
  assert.equal(requests.length, 2);

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state().status, 'navigating');
  assert.equal(sessions.length, 2);
  assert.equal(sessions[0].freed, true);
  assert.equal(ride.ride.reroutes, 1);
  assert.ok(Math.abs(ride.ride.distanceOffset - 300) < 1);
  assert.equal(state().toast.text, 'New route · 0.6 mi');

  // Ride the new route (north from the off-route point) to its end.
  const newStart = [off.lat, off.lng];
  ride.onFix(fixAt(along(newStart, 500), t0 + 160000));
  ride.onFix(fixAt(along(newStart, 998), t0 + 260000));
  assert.equal(state().status, 'arrived');
  assert.equal(state().summary.distance, '0.8 mi');
  assert.equal(state().summary.note, 'Simulated ride · rerouted 1×');
  // Nothing keeps running behind the arrival card.
  assert.equal(ride.sim.running, false);
  assert.equal(ride.sim.timer, null);
  assert.equal(ride.camera.running, false);
  assert.equal(compass.listeners.size, 0);

  assert.deepEqual(
    events.map((e) => e.name),
    ['nav_start', 'nav_reroute', 'nav_arrive'],
  );
  assert.deepEqual(events[1].properties, { scenario: '1', reroutes: 1 });
  assert.equal(events[2].properties.scenario, '1');
  assert.equal(events[2].properties.reroutes, 1);
  // The 300 m ridden on the first route and all 1000 m of the second.
  assert.equal(events[2].properties.distanceMeters, 1300);

  // Done after arrival is not an early end.
  ride.end();
  assert.equal(events.length, 3);
});

test('a newer reroute aborts a stale one, and only the newer route is used', async (t) => {
  const first = deferred();
  const second = deferred();
  const { ride, requests, sessions, events } = setup(t, {
    responses: [
      Promise.resolve({ nav_route: { code: 'Ok', route: route(START, 1000) } }),
      first.promise,
      second.promise,
    ],
  });
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  ride.sim.stop();
  ride.reroute(fixAt(along(START, 100, 80), 1));
  ride.reroute(fixAt(along(START, 100, 90), 2));
  assert.equal(requests[1].signal.aborted, true);
  assert.equal(requests[2].signal.aborted, false);

  second.resolve({ nav_route: { code: 'Ok', route: route(along(START, 100, 90), 900) } });
  first.resolve({ nav_route: { code: 'Ok', route: route(along(START, 100, 80), 900) } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sessions.length, 2);
  assert.ok(
    distance(
      [sessions[1].route.geometry[0].lat, sessions[1].route.geometry[0].lng],
      along(START, 100, 90),
    ) < 0.01,
  );
  assert.equal(ride.ride.reroutes, 1);
  assert.equal(ride.rerouting, false);
  assert.equal(events.filter((e) => e.name === 'nav_reroute').length, 1);
});

test('a failed reroute says so and keeps the current route', async (t) => {
  const { ride, sessions, state } = setup(t, {
    responses: [
      Promise.resolve({ nav_route: { code: 'Ok', route: route(START, 1000) } }),
      Promise.reject(new Error('No route found.')),
    ],
  });
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  ride.sim.stop();
  await ride.reroute(fixAt(along(START, 100, 80), 1));
  assert.equal(state().toast.text, "Couldn't reroute: No route found. Retrying…");
  assert.equal(state().status, 'navigating');
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].freed, false);
  assert.equal(ride.rerouting, false);
});

test('ending early tracks the distance ridden, frees the session and clears the map', async (t) => {
  const { ride, sessions, events, map } = setup(t);
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  ride.sim.stop();
  // GPS jitter back and forth along the route adds no distance.
  [180, 200, 170, 240, 215, 250, 230, 245].forEach((meters, i) => {
    ride.onFix(fixAt(along(START, meters), ride.sim.clock + 50000 + i * 1000));
  });
  ride.end();
  assert.equal(sessions[0].freed, true);
  assert.equal(map.layers.size, 0);
  assert.equal(map.sources.size, 0);
  assert.deepEqual(events[1], {
    name: 'nav_end_early',
    properties: { scenario: '1', distanceMeters: 250, reroutes: 0 },
  });
  // Fixes after the end are ignored.
  ride.onFix(fixAt(along(START, 300), ride.sim.clock + 60000));
  assert.equal(events.length, 2);
});

test('analytics never include a location', async (t) => {
  const { ride, events } = setup(t);
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  ride.sim.stop();
  ride.onFix(fixAt(along(START, 300, 100), 1));
  await ride.reroute(fixAt(along(START, 300, 100), 2));
  ride.end();
  assert.deepEqual(
    events.map((e) => e.name),
    ['nav_start', 'nav_reroute', 'nav_end_early'],
  );
  for (const { properties } of events) {
    for (const [key, value] of Object.entries(properties)) {
      assert.ok(['scenario', 'distanceMeters', 'reroutes'].includes(key), key);
      assert.ok(typeof value === 'string' || Number.isInteger(value), key);
    }
  }
});

test("only the route request blames the rider's location for a failed start", async (t) => {
  const far = fixAt(along(START, -400), 1000);
  const engineDown = Object.assign(new Error('Failed to load the navigation engine'), {
    name: 'ChunkLoadError',
  });
  const noEngine = setup(t, {
    simulate: false,
    locate: async () => far,
    loadEngine: () => Promise.reject(engineDown),
  });
  await assert.rejects(
    noEngine.ride.start({ start: point(START), end: point(along(START, 1000)) }),
    (error) => error.name === 'ChunkLoadError' && !error.fromRider,
  );
});

test("a backend without nav=1 doesn't blame the rider's location either", async (t) => {
  const far = fixAt(along(START, -400), 1000);
  const oldBackend = setup(t, {
    simulate: false,
    locate: async () => far,
    responses: [Promise.resolve({ path: ['legacy only'] })],
  });
  await assert.rejects(
    oldBackend.ride.start({ start: point(START), end: point(along(START, 1000)) }),
    (error) => error.message === NO_NAV_ROUTE_MESSAGE && !error.fromRider,
  );
});

test('a nav_route with no route fails the start', async (t) => {
  const { ride } = setup(t, {
    responses: [Promise.resolve({ nav_route: { code: 'Ok', routes: [] } })],
  });
  await assert.rejects(
    ride.start({ start: point(START), end: point(along(START, 1000)) }),
    /no route/,
  );
});

test('a coarse first fix never decides where the ride starts', async (t) => {
  // ±500 m Wi-Fi position, 900 m away: start from the plan.
  const { ride, requests, state } = setup(t, {
    simulate: false,
    locate: async () => fixAt(along(START, -900), 1000, { accuracy: 500 }),
  });
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  assert.deepEqual(requests[0].from, point(START));
  // Coarse watch fixes are not checked either; the first good one is.
  ride.onFix(fixAt(along(START, -900), 2000, { accuracy: 300, course: null }));
  assert.equal(requests.length, 1);
  const here = along(START, -400);
  ride.onFix(fixAt(here, 3000, { accuracy: 10 }));
  assert.equal(requests.length, 2);
  assert.ok(distance([requests[1].from.lat, requests[1].from.lng], here) < 0.01);
  assert.equal(state().status, 'rerouting');
});

test('a new route that Ferrostar rejects keeps the current session running', async (t) => {
  const broken = route(along(START, 100, 80), 900);
  broken.broken = true;
  const { ride, sessions, state } = setup(t, {
    responses: [
      Promise.resolve({ nav_route: { code: 'Ok', route: route(START, 1000) } }),
      Promise.resolve({ nav_route: { code: 'Ok', route: broken } }),
    ],
  });
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  ride.sim.stop();
  await ride.reroute(fixAt(along(START, 100, 80), 1));
  assert.equal(
    state().toast.text,
    "Couldn't reroute: Ferrostar rejected the route. Retrying…",
  );
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].freed, false);
  assert.equal(ride.ride.reroutes, 0);
  ride.onFix(fixAt(along(START, 200), ride.sim.clock + 40000));
  assert.equal(state().status, 'navigating');
  assert.equal(state().offRoute, false);
});

test("a GPS ride's arrival card has no label unless it was rerouted", async (t) => {
  const { ride, state } = setup(t, {
    simulate: false,
    locate: async () => fixAt(START, 1000),
  });
  await ride.start({ start: point(START), end: point(along(START, 1000)) });
  ride.onFix(fixAt(along(START, 998), 200000));
  assert.equal(state().status, 'arrived');
  assert.equal(state().summary.note, '');
});
