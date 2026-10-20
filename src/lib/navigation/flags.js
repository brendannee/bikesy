// Feature and development flags, read from the region's config and the page URL.

// Whether to offer navigation. `setting` is the region's NAVIGATION_ENABLED: true,
// false, or 'url' to offer it only when the page URL includes ?nav=1 (field testing).
// `search` is the page's query string (window.location.search).
export function navigationEnabled(setting, search = '') {
  if (setting === 'url') return new URLSearchParams(search).get('nav') === '1';
  return setting === true;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Development and QA hooks: ?sim=1 rides a simulated rider instead of using GPS, and
// ?debug=1 shows a heading and GPS readout. With ?sim=1, ?warp=8 runs simulated time
// 8 times faster and ?noise=6 adds about 6 m of GPS noise.
export function devFlags(search = '') {
  const params = new URLSearchParams(search);
  return {
    simulate: params.get('sim') === '1',
    debug: params.get('debug') === '1',
    warp: clamp(Number(params.get('warp')) || 1, 1, 16),
    noise: clamp(Number(params.get('noise')) || 0, 0, 50),
  };
}
