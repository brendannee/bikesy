import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SNAP_ENTER_M, SNAP_EXIT_M, routeLock } from './snap.js';

const lock = (o) => routeLock({ offRoute: false, fixCourse: 0, routeCourse: 0, ...o });

test('routeLock: near the line and heading its way, the puck snaps and the route bearing steadies the heading', () => {
  assert.deepEqual(lock({ gap: 6, fixCourse: 10, routeCourse: 2 }), {
    onLine: true,
    routeCourse: 2,
  });
});

test('routeLock: off route, nothing snaps', () => {
  assert.deepEqual(lock({ offRoute: true, gap: 3 }), {
    onLine: false,
    routeCourse: null,
  });
});

test('routeLock: drifting away from the line unsnaps well before the 35 m off-route call', () => {
  assert.equal(lock({ gap: SNAP_ENTER_M + 1 }).onLine, false);
  // Hysteresis: once on the line, GPS noise up to SNAP_EXIT_M keeps it there.
  assert.equal(lock({ gap: SNAP_ENTER_M + 1, wasOnLine: true }).onLine, true);
  assert.equal(lock({ gap: SNAP_EXIT_M + 1, wasOnLine: true }).onLine, false);
});

test('routeLock: a GPS course that disagrees with the route uses the rider’s own course', () => {
  // Mid-turn at a corner: still on the line, but heading their own way.
  assert.deepEqual(lock({ gap: 3, fixCourse: 60, wasOnLine: true }), {
    onLine: true,
    routeCourse: null,
  });
  // A wrong turn: a few metres off and heading elsewhere comes off the line.
  assert.deepEqual(lock({ gap: 8, fixCourse: 90, wasOnLine: true }), {
    onLine: false,
    routeCourse: null,
  });
});

test('routeLock: stopped (no GPS course) only the distance counts', () => {
  assert.deepEqual(lock({ gap: 8, fixCourse: null, routeCourse: 90 }), {
    onLine: true,
    routeCourse: 90,
  });
});

test('routeLock: course agreement wraps around north', () => {
  assert.equal(lock({ gap: 5, fixCourse: 350, routeCourse: 10 }).routeCourse, 10);
});
