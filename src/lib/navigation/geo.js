// Small geodesy helpers. Points are [lat, lon] unless noted.
const R = 6371008.8;
const rad = Math.PI / 180;

export function distance(a, b) {
  const h =
    Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 +
    Math.cos(a[0] * rad) *
      Math.cos(b[0] * rad) *
      Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, h)));
}

// Initial bearing from a to b, degrees clockwise from north (0-360).
export function bearing(a, b) {
  const lat1 = a[0] * rad;
  const lat2 = b[0] * rad;
  const dLon = (b[1] - a[1]) * rad;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

export function destination(p, bearingDeg, meters) {
  const d = meters / R;
  const b = bearingDeg * rad;
  const lat1 = p[0] * rad;
  const lon1 = p[1] * rad;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return [lat2 / rad, lon2 / rad];
}

export function interpolate(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Local equirectangular projection; plenty accurate over a few hundred meters.
function toXY(origin, p) {
  return [
    (p[1] - origin[1]) * rad * R * Math.cos(origin[0] * rad),
    (p[0] - origin[0]) * rad * R,
  ];
}

// Distance from p to segment ab, plus the fraction t along ab of the closest point.
export function pointToSegment(p, a, b) {
  const [px, py] = toXY(a, p);
  const [bx, by] = toXY(a, b);
  const len2 = bx * bx + by * by;
  const t = len2 ? Math.max(0, Math.min(1, (px * bx + py * by) / len2)) : 0;
  return { dist: Math.hypot(px - t * bx, py - t * by), t };
}

// Signed difference b - a between two bearings (0-360), in [-180, 180).
export function angleDiff(a, b) {
  return ((b - a + 540) % 360) - 180;
}

// Ferrostar geometry ({ lat, lng }[]) -> [lat, lon][].
export function toPoints(coords) {
  return coords.map((c) => [c.lat, c.lng]);
}

// Bearing at the start of a route: from the first point to the first one more than
// 8 m away, so a cluster of near-duplicate points can't give a random direction.
export function initialBearing(points) {
  if (points.length < 2) return 0;
  const a = points[0];
  const b = points.find((p) => distance(a, p) > 8) || points[1];
  return bearing(a, b);
}
