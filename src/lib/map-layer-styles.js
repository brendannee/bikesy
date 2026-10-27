export const ROUND_LINE_LAYOUT = { 'line-join': 'round', 'line-cap': 'round' };

// Widths are pixels at zoom 12, 16 and 19, scaled exponentially between stops so
// overlays neither crowd the basemap zoomed out nor thin to hairlines zoomed in.
export const zoomScaledLineWidth = (z12, z16, z19) => [
  'interpolate',
  ['exponential', 1.5],
  ['zoom'],
  12,
  z12,
  16,
  z16,
  19,
  z19,
];
