// Simulated rider (?sim=1): moves along a path at bike speed, emitting 1 Hz "GPS"
// fixes with optional noise, and can deliberately miss a turn to exercise off-route.
import { bearing, destination, distance, interpolate, pointToSegment } from './geo.js';

export const MIN_SPEED_KMH = 5;
export const MAX_SPEED_KMH = 45;

function gaussian(random) {
  let u = 0;
  let v = 0;
  while (!u) u = random();
  while (!v) v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export class Simulator {
  // onLocation receives fixes in the same shape as DeviceLocation:
  // { lat, lng, accuracy, course, speed, timestamp }.
  //
  // The clock, timer and random source can be replaced for tests:
  //   now()                      -> ms since the epoch (default Date.now)
  //   setTimer(fn, ms) -> id     (default setTimeout)
  //   clearTimer(id)             (default clearTimeout)
  //   random()                   -> [0, 1) (default Math.random)
  constructor(
    onLocation,
    {
      now = () => Date.now(),
      setTimer = (fn, ms) => setTimeout(fn, ms),
      clearTimer = (id) => clearTimeout(id),
      random = () => Math.random(),
    } = {},
  ) {
    this.onLocation = onLocation;
    this.now = now;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.random = random;
    this.speedKmh = 18;
    this.noiseM = 0;
    this.warp = 1;
    this.timer = null;
    this.running = false;
    this.clock = now(); // simulated "now" (ms); advances 1 s per tick
    this.paused = false;
  }

  // points: [lat, lon][]. Starts from the point on the path nearest `from` (if given).
  setPath(points, from = null) {
    this.path = points;
    this.cum = [0];
    for (let i = 1; i < points.length; i++) {
      this.cum.push(this.cum[i - 1] + distance(points[i - 1], points[i]));
    }
    this.s = 0;
    if (from) {
      let best = { d: Infinity, s: 0 };
      for (let i = 0; i < points.length - 1; i++) {
        const { dist, t } = pointToSegment(from, points[i], points[i + 1]);
        if (dist < best.d) {
          best = { d: dist, s: this.cum[i] + t * (this.cum[i + 1] - this.cum[i]) };
        }
      }
      this.s = best.s;
    }
  }

  // Speed up or slow down by delta km/h, within the allowed range.
  adjustSpeed(deltaKmh) {
    this.speedKmh = Math.min(
      MAX_SPEED_KMH,
      Math.max(MIN_SPEED_KMH, this.speedKmh + deltaKmh),
    );
  }

  // Ride the route but go straight through one turn instead of taking it.
  // route: a Ferrostar Route (geometry and steps with visualInstructions). Only turns
  // at least `after` meters along the route count. Returns a [lat, lon][] path to give
  // to setPath, or null if the route has no suitable turn.
  planWrongTurn(route, { after = 250 } = {}) {
    const geom = route.geometry.map((c) => [c.lat, c.lng]);
    let along = 0;
    for (let k = 0; k < route.steps.length - 1; k++) {
      const step = route.steps[k];
      along += step.distance;
      const next = route.steps[k + 1];
      // A step's banner describes the maneuver at its end, i.e. the start of `next`.
      const banner = step.visualInstructions?.[0]?.primaryContent;
      const isTurn =
        banner?.maneuverType === 'turn' &&
        /left|right/.test(banner.maneuverModifier || '');
      if (!isTurn || along < after || step.distance < 80) continue;
      const turnPoint = [next.geometry[0].lat, next.geometry[0].lng];
      // Index of the turn point in the full geometry.
      const idx = geom.findIndex((p) => distance(p, turnPoint) < 1);
      if (idx < 1) continue;
      const approach = bearing(geom[idx - 1], geom[idx]);
      const detour = geom.slice(0, idx + 1);
      for (let d = 20; d <= 300; d += 20)
        detour.push(destination(turnPoint, approach, d));
      return detour;
    }
    return null;
  }

  position() {
    const { path, cum } = this;
    if (this.s >= cum[cum.length - 1]) {
      return { p: path[path.length - 1], course: this.lastCourse ?? 0, done: true };
    }
    let i = 1;
    while (cum[i] < this.s) i++;
    const t = (this.s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    // Course from a point a few meters ahead, so it's smooth through vertices.
    const ahead = Math.min(cum[cum.length - 1], this.s + 6);
    let j = i;
    while (j < cum.length - 1 && cum[j] < ahead) j++;
    const pa = interpolate(path[i - 1], path[i], t);
    const pb = interpolate(
      path[j - 1],
      path[j],
      (ahead - cum[j - 1]) / (cum[j] - cum[j - 1] || 1),
    );
    const course = distance(pa, pb) > 0.5 ? bearing(pa, pb) : (this.lastCourse ?? 0);
    this.lastCourse = course;
    return { p: pa, course, done: false };
  }

  fix() {
    const { p, course, done } = this.position();
    let q = p;
    if (this.noiseM > 0) {
      q = destination(
        p,
        this.random() * 360,
        Math.abs(gaussian(this.random)) * this.noiseM,
      );
    }
    const speed = done || this.paused ? 0 : this.speedKmh / 3.6;
    return {
      lat: q[0],
      lng: q[1],
      accuracy: Math.max(4, this.noiseM * 1.5),
      course: speed > 0 ? course + (this.noiseM ? gaussian(this.random) * 3 : 0) : null,
      speed,
      timestamp: this.clock,
    };
  }

  tick() {
    this.clock += 1000;
    if (!this.paused) this.s += this.speedKmh / 3.6;
    this.onLocation(this.fix());
  }

  start() {
    this.stop();
    this.running = true;
    this.clock = this.now();
    this.onLocation(this.fix());
    // onLocation may stop the ride (arrival): never schedule a tick after stop().
    const loop = () => {
      this.tick();
      if (this.running) this.timer = this.setTimer(loop, 1000 / this.warp);
    };
    if (this.running) this.timer = this.setTimer(loop, 1000 / this.warp);
  }

  stop() {
    this.running = false;
    this.clearTimer(this.timer);
    this.timer = null;
  }
}
