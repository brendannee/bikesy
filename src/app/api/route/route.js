import appConfig from '../../../appConfig/index.js';
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
  // Scenarios that configure a legacy `server` are proxied to it instead.
  const scenario = new URL(request.url).searchParams.get('scenario');
  const legacyServer = appConfig.SCENARIOS[scenario]?.server;
  if (legacyServer) {
    return proxyLegacyRoute(request, legacyServer, HEADERS);
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
