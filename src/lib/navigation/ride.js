// Ride statistics that survive reroutes. Ferrostar tracks distance per session, and
// every reroute starts a new session, so the app carries the totals itself.
import { distance } from './geo.js';

// If the first real fix is farther than this from the planned start, route from
// where the rider actually is.
export const START_REROUTE_METERS = 150;

// fix: { lat, lng }; routeStart: { lat, lng } (the first point of the route geometry).
export function isFarFromStart(fix, routeStart, limit = START_REROUTE_METERS) {
  return distance([fix.lat, fix.lng], [routeStart.lat, routeStart.lng]) > limit;
}

// Metres per second over the ride (elapsed time floored at 1 s).
export function averageSpeed(meters, elapsedMs) {
  return meters / Math.max(1, elapsedMs / 1000);
}

export class Ride {
  constructor({ now = () => Date.now() } = {}) {
    this.now = now;
    this.startedAt = now();
    this.firstFix = null;
    this.checkedStart = false; // whether the first fix has been compared to the route start
    this.distanceOffset = 0; // metres ridden on routes before the current one
    this.reroutes = 0;
    this.track = []; // [lat, lon][] as ridden, detours included
  }

  // Call for every real fix.
  addFix(fix) {
    this.firstFix ??= fix;
  }

  // Append the rider's position (skip while seeding, before the first real fix).
  addTrackPoint(lat, lng) {
    this.track.push([lat, lng]);
  }

  // Call when a reroute succeeds, before freeing the old navigator: its session's
  // distance is added to the running total.
  rerouted(navigator) {
    this.distanceOffset += navigator.snappedDistanceTraveled;
    this.reroutes++;
  }

  // Totals at arrival. complete: TripState.Complete. Pass `simClock` (the simulator's
  // clock) for a simulated ride, whose time runs `warp` times faster than the wall clock.
  summary(complete, { simClock = null } = {}) {
    const meters = this.distanceOffset + complete.summary.snappedDistanceTraveled;
    const elapsedMs =
      simClock != null
        ? simClock - (this.firstFix?.timestamp ?? simClock)
        : this.now() - this.startedAt;
    return {
      meters,
      elapsedMs,
      averageSpeed: averageSpeed(meters, elapsedMs),
      reroutes: this.reroutes,
    };
  }
}
