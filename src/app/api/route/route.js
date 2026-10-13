import { proxyLegacyRoute } from '../../../lib/legacy-routing.js';
import { BIKESY_ROUTE_URL } from '../../../lib/routing.js';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Cache-Control': 'no-store',
};

// Preserve every query parameter, including absent/empty scenario and duplicates.
// The backend owns validation, defaults and the legacy JSON error contract.
export function GET(request) {
  // Tahoe still routes through the legacy server, which has no CORS and is http-only.
  if (process.env.NEXT_PUBLIC_REGION === 'tahoe') {
    return proxyLegacyRoute(request, HEADERS);
  }

  const destination = new URL(BIKESY_ROUTE_URL);
  destination.search = new URL(request.url).search;
  return new Response(null, {
    status: 307,
    headers: { ...HEADERS, Location: destination.href },
  });
}

export const HEAD = GET;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: HEADERS });
}
