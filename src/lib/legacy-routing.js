// Proxies a route request to a legacy routing server (see `server` in appConfig SCENARIOS).
// Legacy servers are plain http without CORS, so the browser can't call them directly.
export async function proxyLegacyRoute(request, server, headers) {
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
