import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  COMPASS_MAX_AGE_MS,
  HeadingState,
  MOVING_GRACE_MS,
  OFFSET_MIN_SPEED,
  chooseHeading,
  compass,
  compassDrivesHeading,
  compassFresh,
  disableCompass,
  enableCompass,
  freshCompassHeading,
  headingFromEuler,
  onCompass,
} from './heading.js';

const near = (actual, expected, tolerance = 0.01) =>
  assert.ok(
    Math.abs(((actual - expected + 540) % 360) - 180) <= tolerance,
    `expected ${expected} +/- ${tolerance}, got ${actual}`,
  );

// --- headingFromEuler -------------------------------------------------------

test('headingFromEuler: a flat phone heads where its top points (alpha is counter-clockwise)', () => {
  near(headingFromEuler(0, 0, 0), 0);
  near(headingFromEuler(90, 0, 0), 270);
  near(headingFromEuler(180, 0, 0), 180);
  near(headingFromEuler(270, 0, 0), 90);
});

test('headingFromEuler: an upright phone on handlebars heads where its back faces', () => {
  near(headingFromEuler(0, 90, 0), 0);
  near(headingFromEuler(90, 90, 0), 270);
  near(headingFromEuler(180, 90, 0), 180);
});

test('headingFromEuler: tilting the phone forward or back does not change the heading', () => {
  for (const alpha of [0, 30, 135, 300]) {
    for (const beta of [0, 20, 45, 60, 75, 90]) {
      near(headingFromEuler(alpha, beta, 0), (360 - alpha) % 360, 0.01);
    }
  }
});

test('headingFromEuler: a tilted phone facing north-west reads 315, not the raw alpha', () => {
  near(headingFromEuler(45, 60, 0), 315);
});

test('headingFromEuler: rolling an upright phone about its long axis turns the heading', () => {
  // Raw alpha stays 0 here, but the back of the phone points 20 degrees west of north.
  near(headingFromEuler(0, 90, 20), 340);
  near(headingFromEuler(0, 90, -20), 20);
});

// --- Policy ---------------------------------------------------------------

test('chooseHeading: moving, GPS course snapped to the route wins over the compass', () => {
  const h = chooseHeading({
    fix: { course: 123 },
    snappedCourse: 120,
    compassHeading: 10,
    previous: { source: 'compass', value: 50 },
    fallbackBearing: 5,
  });
  assert.deepEqual(h, { source: 'gps (snapped)', value: 120, moving: true });
});

test('chooseHeading: moving but off route uses the raw GPS course', () => {
  const h = chooseHeading({
    fix: { course: 123 },
    snappedCourse: null,
    compassHeading: 10,
  });
  assert.deepEqual(h, { source: 'gps course', value: 123, moving: true });
});

test('chooseHeading: slow or stopped uses the compass, ignoring the snapped route bearing', () => {
  const h = chooseHeading({
    fix: { course: null, speed: 0.4 },
    snappedCourse: 120,
    compassHeading: 211,
    previous: { source: 'gps (snapped)', value: 120 },
  });
  assert.deepEqual(h, { source: 'compass', value: 211, moving: false });
});

test('chooseHeading: stopped with no fresh compass holds the last heading', () => {
  const h = chooseHeading({
    fix: { course: null },
    snappedCourse: 120,
    previous: { source: 'compass', value: 77 },
    fallbackBearing: 5,
  });
  assert.deepEqual(h, { source: 'hold', value: 77, moving: false });
});

test('chooseHeading: with nothing else it points along the start of the route', () => {
  const h = chooseHeading({ fix: { course: null }, fallbackBearing: 142 });
  assert.deepEqual(h, { source: 'route start', value: 142, moving: false });
});

test('chooseHeading: a previous heading of 0 (due north) is held, not replaced', () => {
  const h = chooseHeading({
    fix: { course: null },
    previous: { source: 'compass', value: 0 },
    fallbackBearing: 142,
  });
  assert.equal(h.value, 0);
  assert.equal(h.source, 'hold');
});

test('chooseHeading: a simulated ride follows its own course and never the compass', () => {
  const sim = { simulated: true, compassHeading: 300 };
  assert.deepEqual(chooseHeading({ ...sim, fix: { course: 80 }, snappedCourse: 82 }), {
    source: 'sim course',
    value: 82,
    moving: true,
  });
  assert.equal(
    chooseHeading({ ...sim, fix: { course: 80 }, snappedCourse: null }).value,
    80,
  );
  // Paused on the route: no course in the fix, the snapped course still applies.
  const paused = chooseHeading({ ...sim, fix: { course: null }, snappedCourse: 82 });
  assert.deepEqual(paused, { source: 'sim course', value: 82, moving: false });
  // Paused and off route: nothing to follow, so hold rather than return null.
  const lost = chooseHeading({
    ...sim,
    fix: { course: null },
    previous: { source: 'sim course', value: 82 },
  });
  assert.deepEqual(lost, { source: 'hold', value: 82, moving: false });
});

test('compassDrivesHeading: GPS keeps priority for MOVING_GRACE_MS after a moving fix, otherwise the compass drives', () => {
  const moving = { course: 90 };
  const stopped = { course: null };
  assert.equal(
    compassDrivesHeading({
      lastFix: moving,
      lastMovingAt: 10_000,
      now: 10_000 + MOVING_GRACE_MS / 3,
    }),
    false,
  );
  assert.equal(
    compassDrivesHeading({
      lastFix: moving,
      lastMovingAt: 10_000,
      now: 10_000 + MOVING_GRACE_MS - 1,
    }),
    false,
  );
  assert.equal(
    compassDrivesHeading({
      lastFix: moving,
      lastMovingAt: 10_000,
      now: 10_000 + MOVING_GRACE_MS,
    }),
    true,
  );
  assert.equal(
    compassDrivesHeading({
      lastFix: stopped,
      lastMovingAt: 10_000,
      now: 10_000 + MOVING_GRACE_MS / 6,
    }),
    true,
  );
  assert.equal(compassDrivesHeading({ lastFix: null, lastMovingAt: 0, now: 100 }), true);
});

test('HeadingState: the compass takes over between fixes while stationary, GPS while moving', () => {
  let now = 100_000;
  const state = new HeadingState({ fallbackBearing: 140, now: () => now });

  // Seed fix before any real GPS fix: no course, no compass yet.
  assert.equal(state.onFix({ course: null }, 140, null), 140);
  assert.equal(state.current.source, 'route start');

  // Turning in place: compass events drive the heading directly.
  assert.equal(state.onCompass(200), 200);
  assert.equal(state.current.source, 'compass');
  assert.equal(state.onFix({ course: null }, 140, 205), 205);

  // The rider sets off: GPS course wins and the compass is ignored for MOVING_GRACE_MS.
  now += 1000;
  assert.equal(state.onFix({ course: 95 }, 93), 93);
  now += MOVING_GRACE_MS / 2;
  assert.equal(state.onCompass(10), null);
  assert.equal(state.current.source, 'gps (snapped)');

  // GPS goes quiet (last moving fix older than MOVING_GRACE_MS): the compass drives again.
  now += MOVING_GRACE_MS;
  assert.equal(state.onCompass(10), 10);
  assert.equal(state.current.source, 'compass');
});

test('HeadingState: a stationary fix right after moving lets the compass drive immediately', () => {
  let now = 0;
  const state = new HeadingState({ now: () => now });
  state.onFix({ course: 95 }, 93, null);
  now += 500;
  state.onFix({ course: null }, 93, null);
  assert.equal(state.onCompass(300), 300);
});

test('HeadingState: a simulated ride ignores compass events', () => {
  const state = new HeadingState({ simulated: true });
  assert.equal(state.onCompass(10), null);
  assert.equal(state.onFix({ course: 90 }, 91, 300), 91);
});

// --- Compass events ---------------------------------------------------------

function fakeBrowser(t, { DeviceOrientationEvent, absolute = false, angle = 0 } = {}) {
  const listeners = {};
  const win = {
    DeviceOrientationEvent,
    screen: { orientation: { angle } },
    addEventListener: (type, fn) => (listeners[type] = fn),
    removeEventListener: (type, fn) => listeners[type] === fn && delete listeners[type],
  };
  if (absolute) win.ondeviceorientationabsolute = null;
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  globalThis.window = win;
  let clock = 1000;
  t.mock.method(performance, 'now', () => clock);
  t.after(() => {
    disableCompass();
    if (original) Object.defineProperty(globalThis, 'window', original);
    else delete globalThis.window;
  });
  return { listeners, win, tick: (ms) => (clock += ms) };
}

test('iOS: permission is requested from the tap and webkitCompassHeading drives the compass', async (t) => {
  let asked = 0;
  const { listeners, win } = fakeBrowser(t, {
    DeviceOrientationEvent: {
      requestPermission: async () => (asked++, 'granted'),
    },
  });
  const heard = [];
  const off = onCompass((deg) => heard.push(deg));
  const granted = enableCompass();
  assert.equal(asked, 1); // requested synchronously, inside the tap
  assert.equal(compass.status, 'requesting');
  assert.equal(await granted, true);
  assert.equal(compass.status, 'listening');
  assert.ok(listeners.deviceorientation);
  assert.equal(listeners.deviceorientationabsolute, undefined);

  listeners.deviceorientation({ webkitCompassHeading: 90, webkitCompassAccuracy: 15 });
  assert.equal(compass.heading, 90);
  assert.equal(compass.source, 'webkitCompassHeading');
  assert.equal(compass.accuracy, 15);

  // Landscape: the heading is relative to portrait up, so the screen angle is added.
  win.screen.orientation.angle = 90;
  listeners.deviceorientation({ webkitCompassHeading: 350 });
  assert.equal(compass.heading, 80);
  assert.deepEqual(heard, [90, 80]);

  off();
  listeners.deviceorientation({ webkitCompassHeading: 10 });
  assert.deepEqual(heard, [90, 80]);
});

test('iOS: an uncalibrated compass (-1) is ignored', async (t) => {
  const { listeners } = fakeBrowser(t, {
    DeviceOrientationEvent: { requestPermission: async () => 'granted' },
  });
  await enableCompass();
  listeners.deviceorientation({ webkitCompassHeading: -1 });
  listeners.deviceorientation({ webkitCompassHeading: 120, webkitCompassAccuracy: -1 });
  assert.equal(compass.heading, null);
  assert.equal(compass.lastEvent, 0);
  listeners.deviceorientation({ webkitCompassHeading: 120, webkitCompassAccuracy: 20 });
  assert.equal(compass.heading, 120);
});

test('iOS: a denied permission still attaches listeners and reports the answer', async (t) => {
  const { listeners } = fakeBrowser(t, {
    DeviceOrientationEvent: { requestPermission: async () => 'denied' },
  });
  assert.equal(await enableCompass(), false);
  assert.equal(compass.status, 'permission denied');
  assert.ok(listeners.deviceorientation);
});

test('iOS: a rejected permission request is reported, not thrown', async (t) => {
  fakeBrowser(t, {
    DeviceOrientationEvent: {
      requestPermission: () => Promise.reject(new Error('needs a gesture')),
    },
  });
  assert.equal(await enableCompass(), false);
  assert.equal(compass.status, 'permission error: needs a gesture');
});

test('Android: deviceorientationabsolute is tilt corrected; plain events are not a compass', async (t) => {
  const { listeners } = fakeBrowser(t, {
    DeviceOrientationEvent: function () {},
    absolute: true,
  });
  assert.equal(await enableCompass(), true);
  assert.ok(listeners.deviceorientationabsolute);

  // Relative alpha is not a heading.
  listeners.deviceorientation({ absolute: false, alpha: 10, beta: 90, gamma: 0 });
  assert.equal(compass.heading, null);

  // Phone upright on the handlebars, rolled 20 degrees: raw alpha says 0, the phone faces 340.
  listeners.deviceorientationabsolute({ alpha: 0, beta: 90, gamma: 20 });
  near(compass.heading, 340);
  assert.equal(compass.source, 'deviceorientationabsolute');
  assert.equal(compass.raw, 0);

  // Once absolute events arrive, absolute values on the plain event are not used too.
  listeners.deviceorientation({ absolute: true, alpha: 180, beta: 0, gamma: 0 });
  near(compass.heading, 340);
});

test('Firefox Android: absolute values on the plain deviceorientation event', async (t) => {
  const { listeners } = fakeBrowser(t, { DeviceOrientationEvent: function () {} });
  await enableCompass();
  assert.equal(listeners.deviceorientationabsolute, undefined);
  listeners.deviceorientation({ absolute: true, alpha: 90, beta: 0, gamma: 0 });
  near(compass.heading, 270);
  assert.equal(compass.source, 'deviceorientation(absolute)');
});

test('a browser without DeviceOrientationEvent is unsupported', async (t) => {
  fakeBrowser(t, {});
  assert.equal(await enableCompass(), false);
  assert.equal(compass.status, 'unsupported');
});

test('compassFresh: a reading counts as current for 1.5 s', async (t) => {
  const { listeners, tick } = fakeBrowser(t, { DeviceOrientationEvent: function () {} });
  await enableCompass();
  assert.equal(compassFresh(), false);
  assert.equal(freshCompassHeading(), null);
  listeners.deviceorientation({ absolute: true, alpha: 0, beta: 0, gamma: 0 });
  assert.equal(COMPASS_MAX_AGE_MS, 1500);
  tick(1400);
  assert.equal(compassFresh(), true);
  assert.equal(freshCompassHeading(), 0);
  tick(200);
  assert.equal(compassFresh(), false);
  assert.equal(freshCompassHeading(), null);
  assert.equal(compassFresh(5000), true);
});

test('compass.rate counts events in the last second', async (t) => {
  const { listeners, tick } = fakeBrowser(t, { DeviceOrientationEvent: function () {} });
  await enableCompass();
  for (let i = 0; i < 5; i++) {
    listeners.deviceorientation({ absolute: true, alpha: 0, beta: 0, gamma: 0 });
    tick(100);
  }
  assert.equal(compass.rate, 5);
  tick(900);
  listeners.deviceorientation({ absolute: true, alpha: 0, beta: 0, gamma: 0 });
  assert.equal(compass.rate, 2);
});

test('disableCompass: removes the listeners and forgets the reading', async (t) => {
  const { listeners } = fakeBrowser(t, {
    DeviceOrientationEvent: function () {},
    absolute: true,
  });
  await enableCompass();
  listeners.deviceorientationabsolute({ alpha: 0, beta: 0, gamma: 0 });
  assert.equal(compass.heading, 0);
  disableCompass();
  assert.deepEqual(Object.keys(listeners), []);
  assert.equal(compass.heading, null);
  assert.equal(compass.status, 'off');
  // And it can be enabled again for the next ride.
  await enableCompass();
  assert.ok(listeners.deviceorientation);
});

test('HeadingState: the compass learns its offset from GPS course while riding, so stopping does not swing the map', () => {
  let now = 0;
  const state = new HeadingState({ now: () => now });
  // Riding north-east at 5 m/s; the compass reads 13° low (magnetic declination).
  for (let i = 0; i < 40; i++) {
    now += 1000;
    state.onFix({ course: 45, speed: 5 }, null, 32);
  }
  assert.ok(Math.abs(state.compassOffset - 13) < 0.5);
  // Stopped: the compass drives, corrected.
  now += 5000;
  assert.ok(Math.abs(state.onCompass(32) - 45) < 0.5);
  assert.ok(Math.abs(state.onFix({ course: null, speed: 0 }, null, 122) - 135) < 0.5);
});

test('HeadingState: no offset is learnt from slow fixes, simulated rides or a missing compass', () => {
  const slow = new HeadingState();
  slow.onFix({ course: 45, speed: OFFSET_MIN_SPEED - 0.1 }, null, 0);
  slow.onFix({ course: 45, speed: 5 }, null, null);
  assert.equal(slow.compassOffset, null);
  const sim = new HeadingState({ simulated: true });
  sim.onFix({ course: 45, speed: 5 }, null, 0);
  assert.equal(sim.compassOffset, null);
});

test('HeadingState: the compass offset wraps around north', () => {
  const state = new HeadingState();
  state.onFix({ course: 5, speed: 5 }, null, 355);
  assert.equal(state.compassOffset, 10);
  state.onFix({ course: 175, speed: 5 }, null, 350);
  assert.ok(state.compassOffset >= -180 && state.compassOffset < 180);
});
