import assert from 'node:assert/strict';
import { test } from 'node:test';
import { destination } from './geo.js';
import {
  Ride,
  START_FIX_ACCURACY,
  START_REROUTE_METERS,
  averageSpeed,
  isFarFromStart,
  isStartFix,
} from './ride.js';

const start = { lat: 38.9447, lng: -119.9772 };
const at = (m, accuracy) => {
  const [lat, lng] = destination([start.lat, start.lng], 135, m);
  return { lat, lng, accuracy };
};

test('isFarFromStart: farther than 150 m from the route start', () => {
  assert.equal(START_REROUTE_METERS, 150);
  assert.equal(isFarFromStart(start, start), false);
  assert.equal(isFarFromStart(at(149), start), false);
  assert.equal(isFarFromStart(at(151), start), true);
  assert.equal(isFarFromStart(at(80), start, 50), true);
});

test('isFarFromStart: allows for the fix accuracy', () => {
  assert.equal(isFarFromStart(at(170, 30), start), false);
  assert.equal(isFarFromStart(at(181, 30), start), true);
  assert.equal(isFarFromStart(at(600, 500), start), false);
});

test('isStartFix: only a fix within 50 m decides where a ride starts', () => {
  assert.equal(START_FIX_ACCURACY, 50);
  assert.equal(isStartFix(at(0, 8)), true);
  assert.equal(isStartFix(at(0, 50)), true);
  assert.equal(isStartFix(at(0, 51)), false);
  assert.equal(isStartFix(at(0, 500)), false);
  assert.equal(isStartFix(at(0)), true); // no accuracy reported
});

test('averageSpeed: metres per second, with elapsed time floored at one second', () => {
  assert.equal(averageSpeed(1000, 100000), 10);
  assert.equal(averageSpeed(10, 0), 10);
  assert.equal(averageSpeed(10, 500), 10);
});

test('Ride: distance carries across reroutes and the first fix is remembered', () => {
  let wall = 1_000_000;
  const ride = new Ride({ now: () => wall });
  const first = { lat: 1, lng: 2, timestamp: 10 };
  ride.addFix(first);
  ride.addFix({ lat: 3, lng: 4, timestamp: 20 });
  assert.equal(ride.firstFix, first);

  ride.rerouted({ snappedDistanceTraveled: 400 });
  ride.rerouted({ snappedDistanceTraveled: 250 });
  assert.equal(ride.reroutes, 2);
  assert.equal(ride.distanceOffset, 650);

  wall += 600_000; // ten minutes later
  const summary = ride.summary({ summary: { snappedDistanceTraveled: 1350 } });
  assert.equal(summary.meters, 2000);
  assert.equal(summary.elapsedMs, 600_000);
  assert.equal(summary.reroutes, 2);
  assert.equal(summary.averageSpeed, 2000 / 600);
});

test('Ride: a simulated ride is timed on the simulator clock, not the wall clock', () => {
  const ride = new Ride({ now: () => 5_000_000 });
  ride.addFix({ lat: 1, lng: 2, timestamp: 1_000_000 });
  const summary = ride.summary(
    { summary: { snappedDistanceTraveled: 900 } },
    { simClock: 1_300_000 },
  );
  assert.equal(summary.elapsedMs, 300_000);
  assert.equal(summary.averageSpeed, 3);
});

test('Ride: an arrival with no recorded fix does not produce NaN', () => {
  const ride = new Ride({ now: () => 0 });
  const summary = ride.summary(
    { summary: { snappedDistanceTraveled: 5 } },
    { simClock: 123 },
  );
  assert.equal(summary.elapsedMs, 0);
  assert.equal(summary.averageSpeed, 5);
});

test('Ride: keeps the ridden track as [lat, lon] pairs', () => {
  const ride = new Ride();
  ride.addTrackPoint(38.9, -120);
  ride.addTrackPoint(38.91, -120.01);
  assert.deepEqual(ride.track, [
    [38.9, -120],
    [38.91, -120.01],
  ]);
});
