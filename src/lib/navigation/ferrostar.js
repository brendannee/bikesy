let ferrostarPromise;
let adapter;

// Loads Ferrostar's navigation engine (Rust compiled to WebAssembly, about 880 KB) the
// first time it is called and caches it. Resolves to the module, which exposes
// NavigationSession and RouteAdapter. Never import '@stadiamaps/ferrostar' anywhere else:
// a static import would put the engine in the page bundle.
// A NavigationSession lives in wasm memory, so call session.free() when navigation ends.
export function loadFerrostar() {
  ferrostarPromise ??= import('@stadiamaps/ferrostar').catch((error) => {
    // Let the next tap retry after a failed download.
    ferrostarPromise = undefined;
    throw error;
  });
  return ferrostarPromise;
}

// Converts the backend's `nav_route` (Valhalla's OSRM-format response) into a Ferrostar
// Route, a plain JS object. Throws if the response code isn't "Ok".
export function parseNavRoute(ferrostar, navRoute) {
  // The Valhalla provider pairs a Valhalla request generator with Ferrostar's OSRM
  // response parser (polyline6). We only use the parser; the URL is never called.
  adapter ??= new ferrostar.RouteAdapter({
    Valhalla: { endpointUrl: 'https://unused.invalid/route', profile: 'bicycle' },
  });
  const bytes = new TextEncoder().encode(JSON.stringify(navRoute));
  return adapter.parseResponse(bytes)[0];
}
