// Maneuver icons as SVG markup, keyed by OSRM maneuver type and modifier (the
// `maneuverType` / `maneuverModifier` of Ferrostar's visual instructions). Arrows are
// drawn from the turn angle, so every modifier gets a consistent glyph; types that
// are not special-cased (fork, merge, end of road, roundabout, ...) use the arrow
// for their modifier. Uses `currentColor`, so style it with CSS `color`.
const ANGLES = {
  straight: 0,
  'slight right': 40,
  right: 90,
  'sharp right': 135,
  'slight left': -40,
  left: -90,
  'sharp left': -135,
};

export function maneuverIcon(type, modifier, size = 56) {
  const svg = (body) =>
    `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  if (type === 'arrive') {
    return svg(
      '<path d="M14 42V8" /><path d="M14 9h20l-5 7 5 7H14" fill="currentColor" stroke-width="3" />',
    );
  }
  if (type === 'depart') {
    return svg(
      '<circle cx="24" cy="36" r="5" fill="currentColor"/><path d="M24 30V10"/><path d="M15 18l9-9 9 9"/>',
    );
  }
  if (modifier === 'uturn') {
    return svg('<path d="M32 42V20a8 8 0 0 0-16 0v10"/><path d="M9 24l7 8 7-8"/>');
  }
  const a = ((ANGLES[modifier] ?? 0) * Math.PI) / 180;
  // Stem up from the bottom to a pivot, then out along the turn angle.
  const px = 24 - Math.sin(a) * 6;
  const py = a === 0 ? 14 : 24;
  const len = 16;
  const ex = px + Math.sin(a) * len;
  const ey = py - Math.cos(a) * len;
  const head = (dx) => {
    const ha = a + dx;
    return `${ex - Math.sin(ha) * 9},${ey + Math.cos(ha) * 9}`;
  };
  return svg(
    `<path d="M${px} 44V${py}" opacity=".9"/><path d="M${px} ${py}L${ex} ${ey}"/><path d="M${head(0.6)}L${ex} ${ey}L${head(-0.6)}"/>`,
  );
}
