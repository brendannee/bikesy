// When the puck sits on the route line, and when the route's bearing may steady the
// heading. Ferrostar snaps every fix to the line until it calls the rider off route
// (35 m away, see NAV_CONFIG), and its snapped course is the route's bearing. Shown as
// is, a rider who leaves the route sees the puck keep riding the line, pointing the
// route's way, for 35 m or more. Here the rider's own position and GPS course win as
// soon as they disagree with the route; the route only smooths GPS noise while the
// rider is plainly following it.
import { angleDiff } from './geo.js';

// FIELD-TEST VALUES: deliberately low so GPS and compass noise show on the map rather
// than being smoothed away. Earlier values: 12 m, 20 m, 30°, 5 m.

// Puck on the line within this distance of it (m)...
export const SNAP_ENTER_M = 3;
// ...and off it beyond this distance (hysteresis, so noise doesn't make it hop).
export const SNAP_EXIT_M = 5;
// A moving rider whose GPS course is more than this from the route's bearing is not
// following it (deg). GPS course at riding speed is good to about 10°.
export const COURSE_AGREE_DEG = 10;
// ...and once they are this far from the line too (m), the puck comes off it. Mid-turn
// at a corner the course disagrees for a second while the rider is still on the line.
export const DISAGREE_EXIT_M = 2;

// gap: metres between the GPS fix and its snapped point. fixCourse: GPS course, null
// unless moving. routeCourse: the route's bearing at the snapped point. wasOnLine: the
// previous answer. Returns { onLine, routeCourse } where routeCourse is the route
// bearing to steady the heading with, or null to use the rider's own course.
export function routeLock({ offRoute, gap, fixCourse, routeCourse, wasOnLine = false }) {
  if (offRoute || gap == null || !Number.isFinite(gap)) {
    return { onLine: false, routeCourse: null };
  }
  const agrees =
    fixCourse == null ||
    routeCourse == null ||
    Math.abs(angleDiff(fixCourse, routeCourse)) <= COURSE_AGREE_DEG;
  const onLine =
    gap <= (wasOnLine ? SNAP_EXIT_M : SNAP_ENTER_M) && (agrees || gap <= DISAGREE_EXIT_M);
  return { onLine, routeCourse: onLine && agrees ? routeCourse : null };
}
