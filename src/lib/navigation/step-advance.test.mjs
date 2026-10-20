import assert from 'node:assert/strict';
import { test } from 'node:test';
import { destination } from './geo.js';
import { NAV_CONFIG, Navigator } from './navigator.js';
import { Simulator } from './sim.js';

// Rides the real Ferrostar core (wasm) over a route full of tight junctions with the
// Simulator and checks that the banner follows the rider. Ferrostar is a dependency of
// the app, not of every branch, and older Node versions can't import wasm modules, so
// the tests skip when it can't be loaded.
let ferrostar = null;
let skip = false;
try {
  ferrostar = await import('@stadiamaps/ferrostar');
} catch (e) {
  if (!['ERR_MODULE_NOT_FOUND', 'ERR_UNKNOWN_FILE_EXTENSION'].includes(e.code)) throw e;
  skip = `@stadiamaps/ferrostar could not be loaded (${e.code})`;
}

function polyline6(points) {
  let prev = [0, 0];
  let out = '';
  for (const point of points) {
    for (const i of [0, 1]) {
      const value = Math.round(point[i] * 1e6) - prev[i];
      prev[i] += value;
      let v = value < 0 ? ~(value << 1) : value << 1;
      for (; v >= 0x20; v >>= 5) out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      out += String.fromCharCode(v + 63);
    }
  }
  return out;
}

// An OSRM-format route (what the backend returns as `nav_route`) from [turn, meters] legs:
// turn is degrees clockwise from the previous heading, and each leg is one step.
function osrmRoute(legs) {
  const points = [[39.1667, -120.1439]];
  let heading = 0;
  const steps = legs.map(([turn, meters], i) => {
    heading = (heading + turn + 360) % 360;
    const from = points.at(-1);
    points.push(destination(from, heading, meters));
    const next = legs[i + 1];
    const text = next ? `Turn ${next[0] > 0 ? 'right' : 'left'}.` : 'You have arrived.';
    return {
      maneuver: {
        type: i === 0 ? 'depart' : 'turn',
        modifier: i === 0 ? undefined : turn > 0 ? 'right' : 'left',
        location: [from[1], from[0]],
        bearing_before: 0,
        bearing_after: Math.round(heading),
      },
      bannerInstructions: [
        {
          distanceAlongGeometry: meters,
          primary: {
            type: next ? 'turn' : 'arrive',
            modifier: 'right',
            text,
            components: [{ text, type: 'text' }],
          },
        },
      ],
      voiceInstructions: [],
      intersections: [],
      name: '',
      mode: 'cycling',
      distance: meters,
      duration: meters / 5,
      geometry: polyline6([from, points.at(-1)]),
    };
  });
  const end = points.at(-1);
  steps.push({
    maneuver: {
      type: 'arrive',
      modifier: 'right',
      location: [end[1], end[0]],
      bearing_before: Math.round(heading),
      bearing_after: 0,
    },
    bannerInstructions: [],
    voiceInstructions: [],
    intersections: [],
    name: '',
    mode: 'cycling',
    distance: 0,
    duration: 0,
    geometry: polyline6([end, end]),
  });
  const meters = legs.reduce((sum, [, m]) => sum + m, 0);
  return {
    code: 'Ok',
    routes: [
      {
        distance: meters,
        duration: meters / 5,
        geometry: polyline6(points),
        legs: [{ distance: meters, duration: meters / 5, steps }],
      },
    ],
    waypoints: [],
  };
}

// A hairpin with a 12 m wide U-turn, stair-steps with 8 and 15 m legs, then 20 m blocks:
// the junction layouts where advancing too late or too early shows up fastest.
const LEGS = [
  [0, 150],
  [90, 12],
  [90, 150],
  [-90, 40],
  [90, 15],
  [-90, 8],
  [90, 15],
  [-90, 8],
  [90, 80],
  [90, 20],
  [-90, 20],
  [90, 20],
  [-90, 100],
];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rides the route once. Reports whether it finished, for every step advance how far the
// rider's true (noise-free) position was past the maneuver (negative: before it), and the
// largest gap between distanceAlongRoute and the true distance ridden.
function ride({ route, ends, noiseM, speedKmh, seed }) {
  let fix;
  const sim = new Simulator((f) => (fix = f), { random: mulberry32(seed) });
  sim.noiseM = noiseM;
  sim.speedKmh = speedKmh;
  sim.setPath(route.geometry.map((c) => [c.lat, c.lng]));
  const navigator = new Navigator(ferrostar, route);
  let state = navigator.start(sim.fix());
  const stepIndex = (t) => route.steps.length - t.Navigating.remainingSteps.length;
  let index = stepIndex(state);
  const offsets = [];
  let drift = 0;
  for (let tick = 0; tick < 600; tick++) {
    sim.tick();
    state = navigator.update(fix);
    if (state.Complete) {
      navigator.free();
      return { completed: true, offsets, drift };
    }
    drift = Math.max(drift, Math.abs(navigator.distanceAlongRoute - sim.s));
    const now = stepIndex(state);
    // The jump into the arrival step comes from the arrival condition, not step advance.
    if (now > index && now < route.steps.length - 1) {
      offsets.push(sim.s - ends[now - 1]);
    }
    index = now;
  }
  navigator.free();
  return { completed: false, offsets, drift };
}

function setup() {
  const [parsed] = new ferrostar.RouteAdapter({
    Valhalla: { endpointUrl: 'https://unused.invalid/route', profile: 'bicycle' },
  }).parseResponse(new TextEncoder().encode(JSON.stringify(osrmRoute(LEGS))));
  // Distance along the route at each maneuver.
  const ends = [];
  let along = 0;
  for (const leg of LEGS) ends.push((along += leg[1]));
  return { route: parsed, ends };
}

test(
  'step advance follows the rider through tight junctions despite GPS noise',
  { skip },
  () => {
    const { route, ends } = setup();
    for (const noiseM of [0, 3, 6, 10]) {
      for (const speedKmh of [12, 18, 30]) {
        for (let seed = 1; seed <= 5; seed++) {
          const { completed } = ride({ route, ends, noiseM, speedKmh, seed });
          assert(
            completed,
            `stalled at ${noiseM} m noise, ${speedKmh} km/h, seed ${seed}`,
          );
        }
      }
    }
  },
);

test('step advance waits for the rider to pass each maneuver', { skip }, () => {
  const { route, ends } = setup();
  for (const speedKmh of [12, 18, 30]) {
    const { completed, offsets } = ride({ route, ends, noiseM: 0, speedKmh, seed: 1 });
    assert(completed);
    assert.equal(offsets.length, LEGS.length - 1);
    // Never before the maneuver, and never more than the fallback distance after it.
    assert(
      offsets.every((offset) => offset > 0 && offset < 45),
      `offsets at ${speedKmh} km/h: ${offsets.map((o) => o.toFixed(0))}`,
    );
  }
});

test('distance along the route follows the rider, not the GPS jitter', { skip }, () => {
  const { route, ends } = setup();
  let worst = 0;
  for (const noiseM of [0, 3, 6, 10]) {
    for (const speedKmh of [12, 18, 30]) {
      for (let seed = 1; seed <= 5; seed++) {
        worst = Math.max(worst, ride({ route, ends, noiseM, speedKmh, seed }).drift);
      }
    }
  }
  // Summing the snapped position's movement runs 27% over at 6 m of noise (170 m over
  // this 640 m route). Progress only lags by a step advance (the banner's step caps it) or
  // leads by the arrival step, which starts about 20 m before the end.
  assert(worst < 60, `${worst.toFixed(0)} m off`);
});

test('a lone GPS spike mid-step does not skip the step', { skip }, () => {
  const { route } = setup();
  const start = [route.geometry[0].lat, route.geometry[0].lng];
  const navigator = new Navigator(ferrostar, route);
  const fixAt = (north, east, tick) => {
    const [lat, lng] = destination(destination(start, 0, north), 90, east);
    return { lat, lng, accuracy: 10, course: 0, speed: 5, timestamp: tick * 1000 };
  };
  navigator.start(fixAt(0, 0, 0));
  // 40 m up the 150 m first leg, a few fixes 60 m to the side, then back on the route.
  const track = [
    [20, 0],
    [40, 0],
    [45, 60],
    [50, 60],
    [55, 60],
    [60, 0],
    [70, 0],
  ];
  track.forEach(([north, east], i) => {
    const state = navigator.update(fixAt(north, east, i + 1));
    assert.equal(state.Navigating.remainingSteps.length, route.steps.length);
  });
  navigator.free();
});
