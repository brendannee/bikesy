export const BIKESY_ROUTE_URL = 'https://api.bikesy.com/route';

export async function requestRoute(
  start,
  end,
  scenario,
  { signal, url = BIKESY_ROUTE_URL } = {},
) {
  const target = new URL(url);
  target.searchParams.set('lat1', start.lat);
  target.searchParams.set('lng1', start.lng);
  target.searchParams.set('lat2', end.lat);
  target.searchParams.set('lng2', end.lng);
  if (scenario !== undefined && scenario !== null && scenario !== '') {
    target.searchParams.set('scenario', scenario);
  }
  const response = await fetch(target, { signal, credentials: 'omit' });
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Routing service returned invalid JSON.');
  }
  // The legacy-compatible backend can return an error envelope with HTTP 200.
  if (payload?.error || !response.ok) {
    throw new Error(
      payload?.error || `Routing service failed with status ${response.status}.`,
    );
  }
  return payload;
}
