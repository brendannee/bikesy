import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  COURSE_AGREE_DEG,
  DISAGREE_EXIT_M,
  SNAP_ENTER_M,
  SNAP_EXIT_M,
  routeLock,
} from './snap.js';

const lock = (o) => routeLock({ offRoute: false, fixCourse: 0, routeCourse: 0, ...o });
const AGREE = COURSE_AGREE_DEG / 2;
const DISAGREE = COURSE_AGREE_DEG + 20;

test('routeLock: near the line and heading its way, the puck snaps and the route bearing steadies the heading', () => {
  assert.deepEqual(
    lock({ gap: SNAP_ENTER_M / 2, fixCourse: 2 + AGREE, routeCourse: 2 }),
    {
      onLine: true,
      routeCourse: 2,
    },
  );
});

test('routeLock: off route, nothing snaps', () => {
  assert.deepEqual(lock({ offRoute: true, gap: 0 }), {
    onLine: false,
    routeCourse: null,
  });
});

test('routeLock: drifting away from the line unsnaps well before the 35 m off-route call', () => {
  assert.ok(SNAP_EXIT_M < 35);
  assert.equal(lock({ gap: SNAP_ENTER_M + 0.5 }).onLine, false);
  // Hysteresis: once on the line, GPS noise up to SNAP_EXIT_M keeps it there.
  assert.equal(
    lock({ gap: SNAP_ENTER_M + 0.5, wasOnLine: true }).onLine,
    SNAP_ENTER_M + 0.5 <= SNAP_EXIT_M,
  );
  assert.equal(lock({ gap: SNAP_EXIT_M + 1, wasOnLine: true }).onLine, false);
});

test('routeLock: a GPS course that disagrees with the route uses the rider’s own course', () => {
  // Mid-turn at a corner: still on the line, but heading their own way.
  assert.deepEqual(
    lock({ gap: DISAGREE_EXIT_M / 2, fixCourse: DISAGREE, wasOnLine: true }),
    {
      onLine: true,
      routeCourse: null,
    },
  );
  // A wrong turn: a little off and heading elsewhere comes off the line.
  assert.deepEqual(lock({ gap: DISAGREE_EXIT_M + 0.5, fixCourse: 90, wasOnLine: true }), {
    onLine: false,
    routeCourse: null,
  });
});

test('routeLock: stopped (no GPS course) only the distance counts', () => {
  assert.deepEqual(lock({ gap: SNAP_ENTER_M / 2, fixCourse: null, routeCourse: 90 }), {
    onLine: true,
    routeCourse: 90,
  });
});

test('routeLock: course agreement wraps around north', () => {
  const lockNorth = lock({ gap: 0, fixCourse: 360 - AGREE / 2, routeCourse: AGREE / 2 });
  assert.equal(lockNorth.routeCourse, AGREE / 2);
});
