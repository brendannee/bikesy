// One ride, from Start ride to arrival or End: the Ferrostar session (Navigator), the
// location source (GPS, or the simulator with ?sim=1), heading, follow camera, route
// layers, reroutes and ride totals. Ported from the demo's main.js.
//
// It keeps no React state. What the screen should show goes out through `publish` (the
// navigation Redux slice) as display-ready values, and only when something changed.
// Analytics go through `track` and never include a location.
//
// The caller requests the compass permission, unlocks speech and asks for the wake
// lock in the Start ride tap, before calling start(): iOS only allows those from a
// user gesture, and start() awaits a location fix and the route first.
import { FollowCamera } from './camera.js';
import { DeviceLocation, currentFix, keepScreenOn, speech } from './device.js';
import { loadFerrostar, parseNavRoute } from './ferrostar.js';
import {
  bannerText,
  formatClock,
  formatDistance,
  formatDuration,
  formatSpeed,
  stepList,
  thenInstruction,
} from './format.js';
import { angleDiff, initialBearing, toPoints } from './geo.js';
import { HeadingState, compass, disableCompass, onCompass } from './heading.js';
import { RouteLayers } from './layers.js';
import { Navigator, REROUTE_RETRY_MS, isOffRoute } from './navigator.js';
import { Ride, isFarFromStart } from './ride.js';
import { Simulator } from './sim.js';

export const NO_NAV_ROUTE_MESSAGE =
  "This map's routing server doesn't support navigation yet.";

// Map padding (px) that keeps the route clear of the navigation panels.
const OVERVIEW_PADDING = { top: 150, bottom: 170, left: 40, right: 40 };
const ARRIVAL_PADDING = { top: 60, bottom: 360, left: 40, right: 40 };

export class RideController {
  // map: the app's Mapbox map. scenario: the route type, as for planning.
  // getNavRoute(from, to, { signal }): resolves to a /route?nav=1 response.
  // publish(patch): UI state for the navigation slice. track(name, properties): analytics.
  // simulate: ride the simulator (?sim=1) instead of GPS; sim: { warp, noise }.
  // locate and loadEngine replace the location fix and the Ferrostar loader in tests.
  constructor({
    map,
    scenario,
    getNavRoute,
    publish,
    track = () => {},
    simulate = false,
    sim: { warp = 1, noise = 0 } = {},
    locate = currentFix,
    loadEngine = loadFerrostar,
  }) {
    Object.assign(this, { map, scenario, getNavRoute, track, simulate, locate });
    this.loadEngine = loadEngine;
    this.sendUpdate = publish;
    this.published = {};
    this.status = 'idle'; // idle | starting | navigating | arrived | ended
    this.rerouting = false;
    this.lastRerouteAttempt = 0;
    this.lastFix = null;
    this.toastId = 0;
    if (simulate) {
      this.sim = new Simulator((fix) => this.onFix(fix));
      this.sim.warp = warp;
      this.sim.noiseM = noise;
    } else {
      this.gps = new DeviceLocation(
        (fix) => this.onFix(fix),
        (error) => this.toast(`GPS: ${error.message}`, 5000),
      );
    }
  }

  // Publish only the values that changed since the last update.
  publish(patch) {
    const changed = {};
    for (const [key, value] of Object.entries(patch)) {
      const json = JSON.stringify(value);
      if (this.published[key] !== json) {
        this.published[key] = json;
        changed[key] = value;
      }
    }
    if (Object.keys(changed).length) this.sendUpdate(changed);
  }

  toast(text, ms = 2500) {
    this.publish({ toast: { text, ms, id: ++this.toastId } });
  }

  get riding() {
    return this.status === 'navigating';
  }

  // start: the planned start, end: the destination ({ lat, lng }). Resolves once the
  // ride is running; rejects (with a message for the rider) if it couldn't start.
  async start({ start, end }) {
    this.status = 'starting';
    this.destination = end;
    this.startAbort = new AbortController();
    const { signal } = this.startAbort;
    // Download the engine while we find the rider and fetch the route.
    this.engine = this.loadEngine();
    this.engine.catch(() => {});

    // The simulator always rides from the planned start. A real rider who is well
    // away from it gets a route from where they are.
    let fix = null;
    let from = start;
    if (!this.simulate) {
      fix = await this.locate();
      if (fix && isFarFromStart(fix, start)) from = { lat: fix.lat, lng: fix.lng };
    }
    if (signal.aborted) return;
    const route = await this.fetchRoute(from, signal);
    if (signal.aborted) return;
    this.begin(await this.engine, route, fix);
  }

  async fetchRoute(from, signal) {
    const [ferrostar, response] = await Promise.all([
      this.engine,
      this.getNavRoute(from, this.destination, { signal }),
    ]);
    // A backend without nav=1 support answers with the planning response only.
    if (!response.nav_route) throw new Error(NO_NAV_ROUTE_MESSAGE);
    return parseNavRoute(ferrostar, response.nav_route);
  }

  begin(ferrostar, route, fix) {
    this.ferrostar = ferrostar;
    this.ride = new Ride();
    this.navigator = new Navigator(ferrostar, route);
    const points = toPoints(route.geometry);
    this.heading = new HeadingState({
      simulated: this.simulate,
      fallbackBearing: initialBearing(points),
    });
    this.layers = new RouteLayers(this.map);
    this.layers.setRoute(points);
    this.camera = new FollowCamera(this.map, {
      onUserGesture: () => this.publish({ following: false }),
    });
    this.camera.showPuck(true);
    // Compass events (up to ~60 Hz) turn the map between fixes while the rider is
    // stopped; HeadingState ignores them while GPS says the rider is moving.
    this.stopCompass = onCompass((degrees) => {
      const heading = this.heading.onCompass(degrees);
      if (heading != null) this.camera.setCourse(heading);
    });
    this.status = 'navigating';
    this.publish({ status: 'navigating', following: true, offRoute: false });
    this.publishSim();
    this.track('nav_start', {
      scenario: this.scenario,
      distanceMeters: Math.round(route.distance),
    });

    if (this.sim) {
      this.sim.setPath(points);
      const first = this.sim.fix();
      this.render(this.navigator.start(first), first);
      this.camera.follow(true);
      this.sim.start();
    } else if (fix) {
      // The fix that decided where the route starts is the first real one.
      this.ride.checkedStart = true;
      this.ride.addFix(fix);
      this.lastFix = fix;
      this.render(this.navigator.start(fix), fix);
      this.camera.follow(true);
      this.gps.start();
    } else {
      // No fix yet: sit at the route start, silently, until the first one arrives. No
      // course on the seed: it isn't movement, and would block the compass.
      const g = route.geometry[0];
      const seed = {
        lat: g.lat,
        lng: g.lng,
        accuracy: 50,
        course: null,
        timestamp: Date.now(),
      };
      this.render(this.navigator.start(seed), seed, { silent: true });
      this.camera.follow(true);
      this.gps.start();
    }
  }

  onFix(fix) {
    if (!this.riding || !this.navigator) return;
    this.lastFix = fix;
    this.ride.addFix(fix);
    // If the first real fix is far from where the route starts, route from here.
    if (!this.simulate && !this.ride.checkedStart) {
      this.ride.checkedStart = true;
      if (isFarFromStart(fix, this.navigator.route.geometry[0])) {
        this.reroute(fix, 'Routing from your location…');
      }
    }
    const tripState = this.navigator.update(fix);
    this.render(tripState, fix);
    if (
      isOffRoute(tripState) &&
      !this.rerouting &&
      this.navigator.shouldReroute(fix.timestamp) &&
      Date.now() - this.lastRerouteAttempt > REROUTE_RETRY_MS
    ) {
      this.reroute(fix);
    }
  }

  render(tripState, fix, { silent = false } = {}) {
    if (!tripState) return;
    if (tripState.Complete) {
      this.arrive(tripState.Complete);
      return;
    }
    const n = tripState.Navigating;
    if (!n) return;
    const off = isOffRoute(tripState);

    // Puck: snapped to the line while on route, raw GPS when off it.
    const location = off ? n.userLocation : n.snappedUserLocation;
    const { lat, lng } = location.coordinates;
    if (!silent) this.ride.addTrackPoint(lat, lng);
    // Heading: GPS or sim course while moving, else the compass, else hold.
    const course = this.heading.onFix(
      fix,
      off ? null : location.courseOverGround?.degrees,
    );
    this.camera.moveTo([lat, lng], course, this.sim ? 1000 / this.sim.warp : 1000);
    if (!off) this.layers.setProgress([lat, lng]);
    this.layers.setManeuver(off ? null : n.remainingSteps[1]?.geometry?.[0]);

    const instruction = n.visualInstruction?.primaryContent;
    const then = thenInstruction(n);
    const remaining = n.progress.durationRemaining;
    // Simulated time runs `warp` times faster than the wall clock.
    const arrival = Date.now() + (remaining * 1000) / (this.sim?.warp ?? 1);
    this.publish({
      offRoute: off,
      // Ferrostar has no instruction while off route; keep the last one for when the
      // rider gets back on.
      ...(instruction &&
        !off && {
          banner: {
            type: instruction.maneuverType,
            modifier: instruction.maneuverModifier,
            distance: formatDistance(n.progress.distanceToNextManeuver),
            text: bannerText(instruction.text),
            then: then && {
              type: then.maneuverType,
              modifier: then.maneuverModifier,
              text: bannerText(then.text),
            },
          },
        }),
      trip: {
        arrival: formatClock(new Date(arrival)),
        timeLeft: formatDuration(remaining),
        distanceLeft: formatDistance(n.progress.distanceRemaining),
      },
      steps: stepList(n.remainingSteps, { upcoming: true }).map((step) => ({
        ...step,
        distance: step.distance ? formatDistance(step.distance) : '',
      })),
    });

    const spoken = n.spokenInstruction;
    if (spoken && !off && !silent) speech.say(spoken.text, spoken.utteranceId);
  }

  async reroute(fix, message = 'Rerouting…') {
    this.rerouting = true;
    this.lastRerouteAttempt = Date.now();
    speech.say(
      message.replace('…', '.'),
      `reroute-${this.ride.reroutes}-${this.lastRerouteAttempt}`,
    );
    this.toast(message);
    this.publish({ status: 'rerouting' });
    // At most one request in flight: a newer reroute replaces a stale one.
    this.rerouteAbort?.abort();
    const request = (this.rerouteAbort = new AbortController());
    try {
      const route = await this.fetchRoute({ lat: fix.lat, lng: fix.lng }, request.signal);
      if (request.signal.aborted || !this.riding) return;
      // Each Ferrostar session counts its own distance; carry it across reroutes.
      this.ride.rerouted(this.navigator);
      this.navigator.free();
      this.navigator = new Navigator(this.ferrostar, route);
      const points = toPoints(route.geometry);
      this.layers.setRoute(points);
      // The simulated rider heads from where they are onto the new route.
      if (this.sim) this.sim.setPath([[fix.lat, fix.lng], ...points]);
      const here = this.lastFix || fix;
      // New route starts behind us? Say so before the first instruction.
      if (
        here.course != null &&
        Math.abs(angleDiff(here.course, initialBearing(points))) > 120
      ) {
        speech.say('Make a U-turn when possible.', `uturn-${this.ride.reroutes}`);
      }
      this.toast(`New route · ${formatDistance(route.distance)}`);
      this.track('nav_reroute', {
        scenario: this.scenario,
        reroutes: this.ride.reroutes,
      });
      this.render(this.navigator.start(here), here);
    } catch (error) {
      if (request.signal.aborted || error.name === 'AbortError') return;
      this.toast(`Couldn't reroute: ${error.message} Retrying…`, 4000);
    } finally {
      if (this.rerouteAbort === request) {
        this.rerouteAbort = null;
        this.rerouting = false;
        if (this.riding) this.publish({ status: 'navigating' });
      }
    }
  }

  // Metres ridden so far, across reroutes.
  distanceRidden() {
    return (
      (this.ride?.distanceOffset ?? 0) + (this.navigator?.snappedDistanceTraveled ?? 0)
    );
  }

  arrive(complete) {
    if (!this.riding) return;
    this.stopSources();
    this.status = 'arrived';
    this.rerouteAbort?.abort();
    this.layers.setManeuver(null);
    const summary = this.ride.summary(complete, { simClock: this.sim?.clock ?? null });
    // Zoom out to the ride as ridden, detours included, above the arrival card.
    this.camera.showPuck(false);
    const points =
      this.ride.track.length > 1
        ? this.ride.track
        : toPoints(this.navigator.route.geometry);
    this.layers.setRoute(points);
    this.camera.fit(points, ARRIVAL_PADDING);
    const kind = this.sim ? 'Simulated ride' : 'GPS ride';
    this.publish({
      status: 'arrived',
      offRoute: false,
      following: true,
      summary: {
        distance: formatDistance(summary.meters),
        time: formatDuration(summary.elapsedMs / 1000),
        speed: formatSpeed(summary.averageSpeed),
        note: summary.reroutes ? `${kind} · rerouted ${summary.reroutes}×` : kind,
      },
    });
    this.track('nav_arrive', {
      scenario: this.scenario,
      distanceMeters: Math.round(summary.meters),
      reroutes: summary.reroutes,
    });
  }

  stopSources() {
    this.sim?.stop();
    this.gps?.stop();
    keepScreenOn(false);
  }

  // End the ride (End, Done, or a failed start) and take everything off the map. The
  // caller restores the planning screen.
  end() {
    if (this.riding) {
      this.track('nav_end_early', {
        scenario: this.scenario,
        distanceMeters: Math.round(this.distanceRidden()),
        reroutes: this.ride.reroutes,
      });
    }
    this.status = 'ended';
    this.startAbort?.abort();
    this.rerouteAbort?.abort();
    this.stopSources();
    this.stopCompass?.();
    disableCompass();
    speech.reset();
    this.navigator?.free();
    this.navigator = null;
    this.camera?.destroy();
    this.layers?.remove();
  }

  // --- Controls ---------------------------------------------------------------------

  recenter() {
    this.camera?.follow(true);
    this.publish({ following: true });
  }

  // The whole route, north up; Recenter goes back to following.
  overview() {
    if (!this.navigator) return;
    this.camera.fit(toPoints(this.navigator.route.geometry), OVERVIEW_PADDING);
    this.publish({ following: false });
  }

  publishSim() {
    if (this.sim) {
      this.publish({ sim: { speedKmh: this.sim.speedKmh, paused: this.sim.paused } });
    }
  }

  adjustSimSpeed(deltaKmh) {
    this.sim?.adjustSpeed(deltaKmh);
    this.publishSim();
  }

  toggleSimPause() {
    if (!this.sim) return;
    this.sim.paused = !this.sim.paused;
    this.publishSim();
  }

  // Ride straight through the next turn at least 100 m ahead, to test rerouting.
  missNextTurn() {
    if (!this.sim || !this.riding) return;
    const detour = this.sim.planWrongTurn(this.navigator.route, {
      after: this.navigator.snappedDistanceTraveled + 100,
    });
    if (!detour) {
      this.toast('No turn ahead to miss.');
      return;
    }
    this.sim.setPath(detour, this.sim.position().p);
    this.toast('Missing the next turn…');
  }

  // ?debug=1 readout.
  debugLines() {
    const f = (v, digits = 0) =>
      v == null || !Number.isFinite(Number(v)) ? '–' : Number(v).toFixed(digits);
    const fix = this.lastFix;
    const age = compass.lastEvent
      ? ((performance.now() - compass.lastEvent) / 1000).toFixed(1)
      : '–';
    const bearing = ((this.map.getBearing() % 360) + 360) % 360;
    return [
      `compass  ${compass.status}  ${compass.source ?? 'no events'}`,
      `  raw ${f(compass.raw, 1)}  hdg ${f(compass.heading, 1)}  ${compass.rate}/s  age ${age}s  acc ${f(compass.accuracy)}`,
      `  screen ${screen.orientation?.type ?? ''} ${f(screen.orientation?.angle ?? window.orientation)}°`,
      `gps  spd ${f(fix?.speed, 1)} m/s  hdg ${f(fix?.rawHeading)}  course ${f(fix?.course)}  ±${f(fix?.accuracy)} m`,
      `use  ${this.heading?.current?.source ?? '–'} ${f(this.heading?.current?.value)}°`,
      `map  bearing ${f(bearing)}°  puck ${f(this.camera?.display?.course)}°  ${this.camera?.following ? 'follow' : 'free'}`,
    ];
  }
}
