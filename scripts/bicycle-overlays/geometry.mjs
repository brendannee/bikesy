// Iterative Ramer–Douglas–Peucker in a local equirectangular metric projection.
// For visualization only: intermediate junction topology is not guaranteed.
export function simplifyMeters(coordinates, tolerance) {
  if (!tolerance || coordinates.length <= 2) return coordinates;
  const lat = coordinates.reduce((s, p) => s + p[1], 0) / coordinates.length;
  const scaleX = 111195.08 * Math.cos((lat * Math.PI) / 180);
  const points = coordinates.map(([x, y]) => [x * scaleX, y * 111195.08]);
  if (
    coordinates.some(
      (p) => Math.abs(p[0] - coordinates[0][0]) > 2 || Math.abs(p[1] - lat) > 2,
    ) ||
    Math.abs(lat) > 80
  ) {
    throw new Error(
      'Meter simplification is limited to local ways within 2 degrees and below 80 degrees latitude.',
    );
  }
  const kept = new Set([0, points.length - 1]);
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a],
      [bx, by] = points[b];
    const dx = bx - ax,
      dy = by - ay,
      length2 = dx * dx + dy * dy;
    let farthest = -1,
      distance2 = tolerance * tolerance;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = points[i];
      const t = length2
        ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length2))
        : 0;
      const d = (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2;
      if (d > distance2) {
        distance2 = d;
        farthest = i;
      }
    }
    if (farthest !== -1) {
      kept.add(farthest);
      stack.push([a, farthest], [farthest, b]);
    }
  }
  return [...kept].sort((a, b) => a - b).map((i) => coordinates[i]);
}

export function outputGeometry(coordinates, { simplify = 0, precision } = {}) {
  if (!coordinates || coordinates.length < 2) return null;
  const transformed = simplifyMeters(coordinates, simplify).map((p) =>
    precision === undefined ? p : p.map((n) => Number(n.toFixed(precision))),
  );
  const unique = transformed.filter(
    (p, i) => i === 0 || p[0] !== transformed[i - 1][0] || p[1] !== transformed[i - 1][1],
  );
  return unique.length >= 2 ? { type: 'LineString', coordinates: unique } : null;
}
