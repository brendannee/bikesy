// Feature and development flags, read from the region's config and the page URL.

// Whether to offer navigation. `setting` is the region's NAVIGATION_ENABLED: true,
// false, or 'url' to offer it only when the page URL includes ?nav=1 (field testing).
// `search` is the page's query string (window.location.search).
export function navigationEnabled(setting, search = '') {
  if (setting === 'url') return new URLSearchParams(search).get('nav') === '1';
  return setting === true;
}

// Development and QA hooks: ?sim=1 rides a simulated rider instead of using GPS, and
// ?debug=1 shows a heading and GPS readout.
export function devFlags(search = '') {
  const params = new URLSearchParams(search);
  return { simulate: params.get('sim') === '1', debug: params.get('debug') === '1' };
}
