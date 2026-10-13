import { BIKESY_ROUTE_URL } from './routing.js';
import { validateUrlParams } from './url.js';

export function warmupRoutingBackend(urlParameters, routeUrl = BIKESY_ROUTE_URL) {
  if (validateUrlParams(urlParameters)) return;
  // Regions that route through a same-origin proxy have no backend to warm up.
  if (!URL.canParse(routeUrl)) return;
  return fetch(new URL('/health', routeUrl), {
    cache: 'no-store',
    credentials: 'omit',
  }).catch(() => {});
}
