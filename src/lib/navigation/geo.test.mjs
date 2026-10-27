import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  angleDiff,
  bearing,
  destination,
  distance,
  initialBearing,
  interpolate,
  pointToSegment,
  toPoints,
} from './geo.js';

const near = (actual, expected, tolerance, message) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message ?? ''} expected ${expected} +/- ${tolerance}, got ${actual}`,
  );

test('distance: one degree of latitude is about 111.2 km, and zero for the same point', () => {
  near(distance([38, -120], [39, -120]), 111195, 5);
  assert.equal(distance([38.9, -120], [38.9, -120]), 0);
});

test('distance: longitude degrees shrink with latitude and the order does not matter', () => {
  const eq = distance([0, 0], [0, 1]);
  const tahoe = distance([39, 0], [39, 1]);
  near(tahoe / eq, Math.cos((39 * Math.PI) / 180), 1e-4);
  assert.equal(
    distance([38.9, -120], [38.95, -119.9]),
    distance([38.95, -119.9], [38.9, -120]),
  );
});

test('bearing: cardinal directions in degrees clockwise from north', () => {
  const o = [38.9, -120];
  near(bearing(o, [39.0, -120]), 0, 1e-6);
  near(bearing(o, [38.9, -119.9]), 90, 0.1);
  near(bearing(o, [38.8, -120]), 180, 1e-6);
  near(bearing(o, [38.9, -120.1]), 270, 0.1);
});

test('destination: inverts distance and bearing', () => {
  const o = [38.9, -120];
  for (const b of [0, 45, 90, 135, 180, 225, 270, 315]) {
    const p = destination(o, b, 250);
    near(distance(o, p), 250, 1e-3, `distance at ${b}`);
    near(angleDiff(bearing(o, p), b), 0, 1e-3, `bearing at ${b}`);
  }
});

test('interpolate: linear between two points', () => {
  assert.deepEqual(interpolate([0, 0], [10, 20], 0), [0, 0]);
  assert.deepEqual(interpolate([0, 0], [10, 20], 0.5), [5, 10]);
  assert.deepEqual(interpolate([0, 0], [10, 20], 1), [10, 20]);
});

test('pointToSegment: perpendicular distance, fraction along, and clamping to the ends', () => {
  const a = [38.9, -120];
  const b = destination(a, 90, 100); // 100 m east
  const side = destination(destination(a, 90, 40), 0, 12); // 40 m along, 12 m north
  const mid = pointToSegment(side, a, b);
  near(mid.dist, 12, 0.05);
  near(mid.t, 0.4, 0.001);
  const before = pointToSegment(destination(a, 270, 30), a, b);
  assert.equal(before.t, 0);
  near(before.dist, 30, 0.05);
  const after = pointToSegment(destination(b, 90, 30), a, b);
  assert.equal(after.t, 1);
  near(after.dist, 30, 0.05);
});

test('pointToSegment: a zero-length segment is just a point', () => {
  const a = [38.9, -120];
  const { dist, t } = pointToSegment(destination(a, 0, 7), a, a);
  assert.equal(t, 0);
  near(dist, 7, 0.01);
});

test('angleDiff: shortest signed turn from a to b, wrapping across north', () => {
  assert.equal(angleDiff(350, 10), 20);
  assert.equal(angleDiff(10, 350), -20);
  assert.equal(angleDiff(90, 90), 0);
  assert.equal(angleDiff(0, 90), 90);
  assert.equal(angleDiff(0, 270), -90);
  assert.equal(angleDiff(0, 180), -180);
});

test('toPoints: Ferrostar { lat, lng } geometry to [lat, lon] pairs', () => {
  assert.deepEqual(
    toPoints([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
    ]),
    [
      [1, 2],
      [3, 4],
    ],
  );
});

test('initialBearing: heads for the first point more than 8 m away', () => {
  const a = [38.9, -120];
  // A near-duplicate point pointing the wrong way is skipped.
  const points = [a, destination(a, 180, 3), destination(a, 90, 50)];
  near(initialBearing(points), bearing(a, points[2]), 1e-9);
  near(initialBearing([a, destination(a, 45, 20)]), 45, 0.01);
});

test('initialBearing: falls back to the second point when all are close, and 0 for a single point', () => {
  const a = [38.9, -120];
  const b = destination(a, 270, 4);
  near(initialBearing([a, b]), 270, 0.01);
  assert.equal(initialBearing([a]), 0);
  assert.equal(initialBearing([]), 0);
});
