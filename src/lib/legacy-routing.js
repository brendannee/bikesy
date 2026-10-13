import tahoe from '../appConfig/tahoe.js';

// Regions whose scenarios still define a `server` use the legacy routing server through
// this proxy instead of the shared Valhalla backend. Currently only Tahoe.
// Imports tahoe.js directly (not appConfig/index) so it also loads under `node --test`.
function getLegacyServer(scenario) {
  return tahoe.SCENARIOS[scenario]?.server;
}

export async function proxyLegacyRoute(request, headers) {
  const respond = (data, status = 200) => Response.json(data, { status, headers });
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  for (const key of ['lat1', 'lng1', 'lat2', 'lng2', 'scenario']) {
    if (!searchParams.get(key)) {
      return respond(
        { error: 'lat1, lng1, lat2, lng2, and scenario are required.' },
        400,
      );
    }
    params.set(key, searchParams.get(key));
  }
  const server = getLegacyServer(params.get('scenario'));
  if (!server) return respond({ error: 'Invalid scenario.' }, 400);

  let upstream;
  try {
    upstream = await fetch(`${server}?${params}`, { cache: 'no-store' });
  } catch (error) {
    return respond(
      {
        error: `Unable to reach the routing service${error?.message ? `: ${error.message}` : '.'}`,
      },
      502,
    );
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return respond({ error: 'Routing service returned invalid JSON.' }, 502);
  }

  if (!upstream.ok) {
    return respond(
      {
        error:
          payload?.error ||
          payload?.message ||
          `Routing service failed with status ${upstream.status}.`,
      },
      upstream.status,
    );
  }
  return respond(payload);
}
