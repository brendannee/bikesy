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
    // Report it like any other lazily loaded code that didn't download.
    const failure = new Error(`Failed to load the navigation engine: ${error.message}`, {
      cause: error,
    });
    failure.name = 'ChunkLoadError';
    throw failure;
  });
  return ferrostarPromise;
}

// Converts the backend's `nav_route` (Valhalla's OSRM-format response) into a Ferrostar
// Route, a plain JS object. Throws if the response code isn't "Ok" or has no route.
export function parseNavRoute(ferrostar, navRoute) {
  // The Valhalla provider pairs a Valhalla request generator with Ferrostar's OSRM
  // response parser (polyline6). We only use the parser; the URL is never called.
  adapter ??= new ferrostar.RouteAdapter({
    Valhalla: { endpointUrl: 'https://unused.invalid/route', profile: 'bicycle' },
  });
  const bytes = new TextEncoder().encode(JSON.stringify(navRoute));
  const [route] = adapter.parseResponse(bytes);
  if (!route) throw new Error('The routing server returned no route.');
  return route;
}
