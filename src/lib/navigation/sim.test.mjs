import assert from 'node:assert/strict';
import { test } from 'node:test';
import { angleDiff, bearing, destination, distance, pointToSegment } from './geo.js';
import { MAX_SPEED_KMH, MIN_SPEED_KMH, Simulator } from './sim.js';

const near = (actual, expected, tolerance, message = '') =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message} expected ${expected} +/- ${tolerance}, got ${actual}`,
  );

// A fake clock and timer: nothing runs until the test calls `run()`.
function fakeTime(start = 1_700_000_000_000) {
  const timers = [];
  let nextId = 1;
  return {
    wall: start,
    now() {
      return this.wall;
    },
    setTimer(fn, ms) {
      const id = nextId++;
      timers.push({ id, fn, ms });
      return id;
    },
    clearTimer(id) {
      const i = timers.findIndex((t) => t.id === id);
      if (i >= 0) timers.splice(i, 1);
    },
    timers,
    // Run the single pending timer (the sim only ever keeps one).
    run() {
      const [timer] = timers.splice(0, 1);
      timer.fn();
      return timer.ms;
    },
  };
}

function makeSim(options = {}) {
  const time = fakeTime();
  const fixes = [];
  const sim = new Simulator((fix) => fixes.push(fix), {
    now: () => time.now(),
    setTimer: (fn, ms) => time.setTimer(fn, ms),
    clearTimer: (id) => time.clearTimer(id),
    ...options,
  });
  return { sim, time, fixes };
}

const origin = [38.9, -120];
const north = (m) => destination(origin, 0, m);

test('a rider on a straight path moves 5 m per second at 18 km/h, heading along the path', () => {
  const { sim, fixes } = makeSim();
  sim.setPath([origin, north(1000)]);
  sim.tick();
  sim.tick();
  sim.tick();
  assert.equal(fixes.length, 3);
  near(distance(origin, [fixes[2].lat, fixes[2].lng]), 15, 0.01);
  assert.equal(fixes[2].speed, 5);
  near(angleDiff(fixes[2].course, 0), 0, 0.01);
  assert.equal(fixes[2].accuracy, 4);
});

test('fix timestamps follow the simulated clock: one second per tick, whatever the warp', () => {
  const { sim, time, fixes } = makeSim();
  sim.warp = 8;
  sim.setPath([origin, north(1000)]);
  sim.start();
  const startedAt = time.wall;
  assert.equal(fixes[0].timestamp, startedAt);
  assert.equal(sim.clock, startedAt);
  time.run();
  time.run();
  assert.deepEqual(
    fixes.map((f) => f.timestamp - startedAt),
    [0, 1000, 2000],
  );
});

test('start emits a fix straight away and schedules ticks every 1000 / warp ms', () => {
  const { sim, time, fixes } = makeSim();
  sim.setPath([origin, north(1000)]);
  sim.start();
  assert.equal(fixes.length, 1);
  assert.equal(fixes[0].speed, 5); // the first fix is at the start of the path
  near(distance(origin, [fixes[0].lat, fixes[0].lng]), 0, 1e-6);
  assert.equal(time.timers.length, 1);
  assert.equal(time.timers[0].ms, 1000);
  assert.equal(time.run(), 1000);
  assert.equal(fixes.length, 2);
  assert.equal(time.timers.length, 1); // rescheduled

  sim.warp = 4;
  time.run(); // the tick that was already scheduled still runs, then the delay shortens
  assert.equal(time.timers[0].ms, 250);
});

test('a stop from inside a tick, as at arrival, schedules nothing more', () => {
  const time = fakeTime();
  let fixes = 0;
  const sim = new Simulator(
    () => {
      fixes++;
      if (fixes === 3) sim.stop();
    },
    {
      now: () => time.now(),
      setTimer: (fn, ms) => time.setTimer(fn, ms),
      clearTimer: (id) => time.clearTimer(id),
    },
  );
  sim.setPath([origin, north(1000)]);
  sim.start();
  time.run();
  time.run(); // the third fix stops the sim
  assert.equal(fixes, 3);
  assert.equal(time.timers.length, 0);
  assert.equal(sim.running, false);

  // Stopped by the very first fix.
  const first = makeSim();
  first.sim.onLocation = () => first.sim.stop();
  first.sim.setPath([origin, north(1000)]);
  first.sim.start();
  assert.equal(first.time.timers.length, 0);
});

test('stop cancels the pending tick, and start again does not double up timers', () => {
  const { sim, time, fixes } = makeSim();
  sim.setPath([origin, north(1000)]);
  sim.start();
  sim.start();
  assert.equal(time.timers.length, 1);
  sim.stop();
  assert.equal(time.timers.length, 0);
  assert.equal(sim.timer, null);
  assert.equal(fixes.length, 2);
});

test('pausing stops progress and reports no speed or course', () => {
  const { sim, fixes } = makeSim();
  sim.setPath([origin, north(1000)]);
  sim.tick();
  sim.paused = true;
  sim.tick();
  sim.tick();
  assert.equal(fixes[1].speed, 0);
  assert.equal(fixes[1].course, null);
  assert.equal(fixes[1].lat, fixes[2].lat);
  sim.paused = false;
  sim.tick();
  near(distance(origin, [fixes[3].lat, fixes[3].lng]), 10, 0.01);
  assert.equal(fixes[3].speed, 5);
});

test('speed follows speedKmh and adjustSpeed clamps to the allowed range', () => {
  const { sim, fixes } = makeSim();
  sim.speedKmh = 36;
  sim.setPath([origin, north(1000)]);
  sim.tick();
  assert.equal(fixes[0].speed, 10);
  near(distance(origin, [fixes[0].lat, fixes[0].lng]), 10, 0.01);

  sim.speedKmh = 18;
  sim.adjustSpeed(-2);
  assert.equal(sim.speedKmh, 16);
  sim.adjustSpeed(100);
  assert.equal(sim.speedKmh, MAX_SPEED_KMH);
  sim.adjustSpeed(-100);
  assert.equal(sim.speedKmh, MIN_SPEED_KMH);
});

test('the rider arrives, stops with no speed, and stays at the end', () => {
  const { sim, fixes } = makeSim();
  sim.setPath([origin, north(12)]); // 12 m = three ticks
  for (let i = 0; i < 5; i++) sim.tick();
  assert.deepEqual(
    fixes.map((f) => f.speed),
    [5, 5, 0, 0, 0],
  );
  const last = fixes[4];
  assert.equal(last.speed, 0);
  assert.equal(last.course, null);
  near(distance(north(12), [last.lat, last.lng]), 0, 0.01);
});

test('the course follows the path around a corner', () => {
  const { sim, fixes } = makeSim();
  const corner = north(100);
  sim.setPath([origin, corner, destination(corner, 90, 500)]);
  for (let i = 0; i < 30; i++) sim.tick();
  near(angleDiff(fixes[5].course, 0), 0, 0.5);
  near(angleDiff(fixes[29].course, 90), 0, 0.5);
});

test('GPS noise offsets fixes, widens accuracy and jitters the course deterministically', () => {
  const { sim, fixes } = makeSim({ random: () => 0.5 });
  sim.noiseM = 6;
  sim.setPath([origin, north(1000)]);
  sim.tick();
  const f = fixes[0];
  // random() = 0.5 everywhere: |gaussian| = sqrt(-2 ln 0.5) = 1.1774, in direction 180 degrees.
  const expected = destination(north(5), 180, 1.1774 * 6);
  near(distance(expected, [f.lat, f.lng]), 0, 0.01);
  assert.equal(f.accuracy, 9);
  near(angleDiff(f.course, -1.1774 * 3), 0, 0.01);

  const { sim: clean, fixes: cleanFixes } = makeSim({ random: () => 0.5 });
  clean.setPath([origin, north(1000)]);
  clean.tick();
  near(angleDiff(cleanFixes[0].course, 0), 0, 0.01);
});

test('setPath starts at the point on the path nearest the given position', () => {
  const { sim, fixes } = makeSim();
  sim.setPath([origin, north(1000)], destination(north(400), 90, 30));
  sim.tick();
  near(distance(north(405), [fixes[0].lat, fixes[0].lng]), 0, 0.05);
  sim.setPath([origin, north(1000)]);
  assert.equal(sim.s, 0);
});

// --- The deliberate wrong turn -------------------------------------------------

const banner = (maneuverType, maneuverModifier) => ({
  primaryContent: { text: '', maneuverType, maneuverModifier },
});

// Ferrostar-shaped route: 400 m north, turn right, 300 m east, turn left, 200 m north.
function turnRoute({ firstStep = 400 } = {}) {
  const a = origin;
  const b = destination(a, 0, firstStep);
  const c = destination(b, 90, 300);
  const d = destination(c, 0, 200);
  const g = (p) => ({ lat: p[0], lng: p[1] });
  return {
    geometry: [g(a), g(b), g(c), g(d)],
    steps: [
      {
        distance: firstStep,
        geometry: [g(a), g(b)],
        visualInstructions: [banner('turn', 'right')],
      },
      {
        distance: 300,
        geometry: [g(b), g(c)],
        visualInstructions: [banner('turn', 'left')],
      },
      {
        distance: 200,
        geometry: [g(c), g(d)],
        visualInstructions: [banner('arrive', 'right')],
      },
      { distance: 0, geometry: [g(d), g(d)], visualInstructions: [] },
    ],
    turn: b,
  };
}

// The turn a detour misses: where it leaves the route for 15 points straight ahead.
const missedTurn = (detour) => detour[detour.length - 16];
const vertex = (route, i) => [route.geometry[i].lat, route.geometry[i].lng];

test('planWrongTurn: goes straight through the first long enough right or left turn', () => {
  const route = turnRoute();
  const { sim } = makeSim();
  const detour = sim.planWrongTurn(route);
  assert.deepEqual(missedTurn(detour), vertex(route, 1));
  // The path follows the route up to the turn, then carries on north for 300 m.
  assert.deepEqual(detour[0], [route.geometry[0].lat, route.geometry[0].lng]);
  assert.deepEqual(detour[1], route.turn);
  const end = detour[detour.length - 1];
  near(distance(route.turn, end), 300, 0.01);
  near(angleDiff(bearing(route.turn, end), 0), 0, 0.01);
  assert.equal(detour.length, 2 + 15);
  // Nowhere near the real next leg, which heads east.
  assert.ok(distance(end, [route.geometry[2].lat, route.geometry[2].lng]) > 300);
});

test('planWrongTurn: skips a turn less than 250 m into the route and takes the next one', () => {
  const route = turnRoute({ firstStep: 200 });
  const { sim } = makeSim();
  const detour = sim.planWrongTurn(route);
  assert.ok(detour);
  assert.deepEqual(missedTurn(detour), vertex(route, 2));
});

test('planWrongTurn: turns before `after` meters are skipped, for a wrong turn mid-ride', () => {
  const route = turnRoute();
  const { sim } = makeSim();
  assert.deepEqual(
    missedTurn(sim.planWrongTurn(route, { after: 400 })),
    vertex(route, 1),
  );
  assert.deepEqual(
    missedTurn(sim.planWrongTurn(route, { after: 401 })),
    vertex(route, 2),
  );
  assert.equal(sim.planWrongTurn(route, { after: 701 }), null);
});

test('planWrongTurn: no suitable turn gives null', () => {
  const { sim } = makeSim();

  const early = turnRoute({ firstStep: 200 });
  early.steps[1].distance = 79; // the second turn follows a step under 80 m
  assert.equal(sim.planWrongTurn(early), null);

  const notTurns = turnRoute();
  notTurns.steps[0].visualInstructions = [banner('new name', 'right')];
  notTurns.steps[1].visualInstructions = [banner('turn', 'straight')];
  assert.equal(sim.planWrongTurn(notTurns), null);

  const noBanner = turnRoute();
  noBanner.steps.forEach((step) => (step.visualInstructions = []));
  assert.equal(sim.planWrongTurn(noBanner), null);
});

test('a rider on the wrong-turn path stays on the route to the turn, then leaves it', () => {
  const route = turnRoute();
  const { sim, fixes } = makeSim();
  sim.setPath(sim.planWrongTurn(route));
  for (let i = 0; i < 100; i++) sim.tick(); // 500 m at 5 m/s; the turn is at 400 m
  const pos = (f) => [f.lat, f.lng];
  const [a, b, c] = route.geometry.map((p) => [p.lat, p.lng]);
  // 395 m in: still on the first leg, 5 m short of the turn.
  near(pointToSegment(pos(fixes[78]), a, b).dist, 0, 0.01);
  near(distance(route.turn, pos(fixes[78])), 5, 0.1);
  // 500 m in: 100 m past the turn, still heading north and 100 m off the east leg.
  near(distance(route.turn, pos(fixes[99])), 100, 0.1);
  near(angleDiff(fixes[99].course, 0), 0, 0.01);
  near(pointToSegment(pos(fixes[99]), b, c).dist, 100, 0.5);
});
