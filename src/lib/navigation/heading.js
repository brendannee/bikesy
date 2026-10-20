// Device compass heading (clockwise from north, degrees) from orientation events,
// independent of GPS fixes so it can drive the map between (or without) fixes.
//
// iOS Safari: `deviceorientation` with webkitCompassHeading (already a compass
//   heading; -1/undefined until calibrated). Needs DeviceOrientationEvent
//   .requestPermission() from a user gesture.
// Android Chrome: `deviceorientationabsolute` alpha/beta/gamma, converted with
//   tilt compensation so it works upright on a handlebar, not just flat.
// Both are relative to the device's portrait "up", so add the screen angle.
//
// Nothing here touches browser globals at import time (SSR-safe): they are only
// read inside functions that run after the rider taps Start ride.

const rad = Math.PI / 180;

// GPS course is only trustworthy while actually moving: DeviceLocation reports a
// course only above this speed (m/s).
export const MIN_COURSE_SPEED = 2;
// How long a compass reading counts as current.
export const COMPASS_MAX_AGE_MS = 1500;
// After a moving GPS fix, GPS course keeps priority over the compass for this long.
export const MOVING_GRACE_MS = 3000;

export const compass = {
  heading: null, // latest heading, degrees
  raw: null, // raw value from the event (webkitCompassHeading or alpha)
  source: null, // 'webkitCompassHeading' | 'deviceorientationabsolute' | 'deviceorientation(absolute)'
  accuracy: null,
  lastEvent: 0, // performance.now() of the last valid reading
  events: 0,
  rate: 0, // events/second, for the debug readout
  status: 'off', // off | requesting | listening | denied | unsupported
  listeners: new Set(),
};

function screenAngle() {
  const a = window.screen?.orientation?.angle ?? window.orientation ?? 0;
  return Number(a) || 0;
}

// Heading of where the phone "looks": the horizontal projection of the device's
// top (y) axis when flat plus its back (-z) axis when upright. Both point the
// same way for a phone pitched forward, and whichever is more horizontal dominates.
export function headingFromEuler(alpha, beta, gamma) {
  const cX = Math.cos(beta * rad);
  const sX = Math.sin(beta * rad);
  const cY = Math.cos(gamma * rad);
  const sY = Math.sin(gamma * rad);
  const cZ = Math.cos(alpha * rad);
  const sZ = Math.sin(alpha * rad);
  // Rotation matrix columns (W3C DeviceOrientation, Z-X'-Y'' order); earth x=E, y=N.
  const yE = -cX * sZ;
  const yN = cZ * cX;
  const backE = -(cY * sZ * sX + cZ * sY);
  const backN = -(sZ * sY - cZ * cY * sX);
  const e = yE + backE;
  const n = yN + backN;
  return (Math.atan2(e, n) / rad + 360) % 360;
}

let rateWindow = [];
function publish(value, source, raw, accuracy) {
  const now = performance.now();
  compass.heading = (value + screenAngle() + 360) % 360;
  compass.raw = raw;
  compass.source = source;
  compass.accuracy = accuracy;
  compass.lastEvent = now;
  compass.events++;
  rateWindow.push(now);
  while (rateWindow.length && rateWindow[0] < now - 1000) rateWindow.shift();
  compass.rate = rateWindow.length;
  for (const fn of compass.listeners) fn(compass.heading);
}

let gotAbsolute = false;
function onAbsolute(e) {
  if (e.alpha == null) return;
  gotAbsolute = true;
  publish(
    headingFromEuler(e.alpha, e.beta ?? 0, e.gamma ?? 0),
    'deviceorientationabsolute',
    e.alpha,
    null,
  );
}
function onOrientation(e) {
  if (typeof e.webkitCompassHeading === 'number') {
    const acc = e.webkitCompassAccuracy;
    if (e.webkitCompassHeading < 0 || (typeof acc === 'number' && acc < 0)) return; // uncalibrated
    // webkitCompassHeading is already tilt-compensated, relative to portrait up.
    publish(e.webkitCompassHeading, 'webkitCompassHeading', e.webkitCompassHeading, acc);
  } else if (e.absolute && e.alpha != null && !gotAbsolute) {
    // e.g. Firefox Android: absolute values on the plain event.
    publish(
      headingFromEuler(e.alpha, e.beta ?? 0, e.gamma ?? 0),
      'deviceorientation(absolute)',
      e.alpha,
      null,
    );
  }
  // Relative (non-absolute) alpha is not a compass heading: ignore it.
}

let attached = false;
function attach() {
  if (attached) return;
  attached = true;
  if ('ondeviceorientationabsolute' in window) {
    window.addEventListener('deviceorientationabsolute', onAbsolute);
  }
  window.addEventListener('deviceorientation', onOrientation);
  compass.status = 'listening';
}

// Call synchronously from a user gesture (tap): iOS requires it for the permission.
// Listeners are attached regardless of the permission answer: on iOS a denial just
// means no events arrive, while some Chrome builds define requestPermission() but
// still deliver deviceorientationabsolute, so the answer must not gate listening.
export function enableCompass() {
  const DOE = window.DeviceOrientationEvent;
  if (!DOE) {
    compass.status = 'unsupported';
    return Promise.resolve(false);
  }
  attach();
  if (typeof DOE.requestPermission !== 'function') return Promise.resolve(true);
  compass.status = 'requesting';
  return DOE.requestPermission()
    .then((r) => {
      compass.status = r === 'granted' ? 'listening' : `permission ${r}`;
      return r === 'granted';
    })
    .catch((err) => {
      compass.status = `permission error: ${err.message || err}`;
      return false;
    });
}

// Stop listening and forget the last reading (end of ride). enableCompass() can be
// called again for the next ride.
export function disableCompass() {
  if (attached && typeof window !== 'undefined') {
    window.removeEventListener('deviceorientationabsolute', onAbsolute);
    window.removeEventListener('deviceorientation', onOrientation);
  }
  attached = false;
  gotAbsolute = false;
  rateWindow = [];
  Object.assign(compass, {
    heading: null,
    raw: null,
    source: null,
    accuracy: null,
    lastEvent: 0,
    events: 0,
    rate: 0,
    status: 'off',
  });
}

export function compassFresh(maxAgeMs = COMPASS_MAX_AGE_MS) {
  return compass.heading != null && performance.now() - compass.lastEvent < maxAgeMs;
}

// The current compass heading, or null if there is no recent reading.
export function freshCompassHeading(maxAgeMs = COMPASS_MAX_AGE_MS) {
  return compassFresh(maxAgeMs) ? compass.heading : null;
}

export function onCompass(fn) {
  compass.listeners.add(fn);
  return () => compass.listeners.delete(fn);
}

// --- Heading policy -----------------------------------------------------------

// Which heading drives the map for a GPS (or simulated) fix.
//
//   fix            { course, ... } as emitted by DeviceLocation / Simulator. `course` is
//                  only set above MIN_COURSE_SPEED with a valid heading, so
//                  `course != null` means "moving".
//   snappedCourse  the route bearing at the snapped position (only meaningful while
//                  moving along the route; pass null when off route)
//   simulated      the sim always follows its own course and never uses the compass
//   compassHeading a fresh compass reading, or null (see freshCompassHeading)
//   previous       the last result of this function, or null at the start of a ride
//   fallbackBearing  bearing of the route start, used until anything better arrives
//
// Moving: GPS course (snapped to the route when we have it). Slow or stopped: the
// compass, if fresh. Otherwise hold the last heading (the route start at first).
// Previously the snapped route bearing always won, so the compass never reached
// the map while the rider turned in place.
//
// Returns { source, value, moving }.
export function chooseHeading({
  fix,
  snappedCourse = null,
  simulated = false,
  compassHeading = null,
  previous = null,
  fallbackBearing = 0,
}) {
  const moving = fix.course != null;
  if (simulated || moving) {
    const value = snappedCourse ?? fix.course;
    if (value != null) {
      const source = simulated
        ? 'sim course'
        : snappedCourse != null
          ? 'gps (snapped)'
          : 'gps course';
      return { source, value, moving };
    }
  }
  if (!simulated && compassHeading != null) {
    return { source: 'compass', value: compassHeading, moving };
  }
  if (previous?.value != null) return { source: 'hold', value: previous.value, moving };
  return { source: 'route start', value: fallbackBearing, moving };
}

// Compass events (up to ~60 Hz) drive the map heading directly between fixes,
// unless GPS says we're moving (then GPS course wins; the compass points where
// the phone faces, not where the bike goes). `lastMovingAt` and `now` are on the
// same clock (performance.now()).
export function compassDrivesHeading({ lastFix, lastMovingAt, now }) {
  const movingRecently =
    lastFix?.course != null && now - (lastMovingAt ?? 0) < MOVING_GRACE_MS;
  return !movingRecently;
}

// chooseHeading plus the small amount of state the ride needs between fixes.
//
//   const heading = new HeadingState({ simulated, fallbackBearing });
//   const value = heading.onFix(fix, snappedCourse); // each render
//   onCompass((deg) => {
//     const v = heading.onCompass(deg); // null while GPS says we're moving
//     if (v != null) map.setCourse(v);
//   });
export class HeadingState {
  constructor({
    simulated = false,
    fallbackBearing = 0,
    now = () => performance.now(),
  } = {}) {
    this.simulated = simulated;
    this.fallbackBearing = fallbackBearing;
    this.now = now;
    this.current = null; // { source, value, moving } for the ?debug=1 readout
    this.lastFix = null;
    this.lastMovingAt = 0;
  }

  // Heading for a fix. `compassHeading` defaults to the live compass.
  onFix(fix, snappedCourse = null, compassHeading = freshCompassHeading()) {
    this.lastFix = fix;
    this.current = chooseHeading({
      fix,
      snappedCourse,
      simulated: this.simulated,
      compassHeading,
      previous: this.current,
      fallbackBearing: this.fallbackBearing,
    });
    if (this.current.moving) this.lastMovingAt = this.now();
    return this.current.value;
  }

  // Heading from a compass event, or null if GPS course should keep priority
  // (or this is a simulated ride).
  onCompass(deg) {
    if (this.simulated) return null;
    const now = this.now();
    if (
      !compassDrivesHeading({
        lastFix: this.lastFix,
        lastMovingAt: this.lastMovingAt,
        now,
      })
    ) {
      return null;
    }
    this.current = { source: 'compass', value: deg, moving: false };
    return deg;
  }
}
