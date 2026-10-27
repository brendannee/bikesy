import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HEADING_EASE_MS, MAX_TURN_DEG_PER_S, easeHeading } from './camera.js';

// Run the damper at 60 fps for `ms`.
function run(from, to, ms) {
  let course = from;
  for (let frame = 0; frame < Math.round((ms * 60) / 1000); frame++) {
    course = easeHeading(course, to, 1000 / 60);
  }
  return course;
}

test('easeHeading: a one-fix change turns the map gradually, not in a snap', () => {
  const after100 = run(0, 20, 100);
  assert.ok(after100 > 0 && after100 < 10, `turned ${after100}° in 100 ms`);
  assert.ok(Math.abs(run(0, 20, 5 * HEADING_EASE_MS) - 20) < 0.5);
});

test('easeHeading: big changes are capped at MAX_TURN_DEG_PER_S', () => {
  const after = run(0, 180 - 1, 1000);
  assert.ok(after <= MAX_TURN_DEG_PER_S + 0.01, `turned ${after}° in 1 s`);
  assert.ok(after > MAX_TURN_DEG_PER_S * 0.9);
});

test('easeHeading: turns the short way round north and lands on the target', () => {
  const c = easeHeading(350, 10, 100);
  assert.ok(c > 350 && c < 360);
  assert.equal(easeHeading(10, 10.01, 16), 10.01);
});
