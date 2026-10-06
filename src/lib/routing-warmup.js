import { BIKESY_ROUTE_URL } from './routing.js';
import { validateUrlParams } from './url.js';

export function warmupRoutingBackend(urlParameters, routeUrl = BIKESY_ROUTE_URL) {
  if (validateUrlParams(urlParameters)) return;
  return fetch(new URL('/health', routeUrl), {
    cache: 'no-store',
    credentials: 'omit',
  }).catch(() => {});
}
