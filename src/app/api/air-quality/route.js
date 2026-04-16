import { NextResponse } from 'next/server';

function json(data, init) {
  return NextResponse.json(data, init);
}

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return json({ error: 'lat and lng are required.' }, { status: 400 });
  }

  const url = `http://www.airnowapi.org/aq/forecast/latLong/?format=application/json&latitude=${lat}&longitude=${lng}&distance=5&API_KEY=${process.env.AIRNOW_API_KEY}`;

  let upstreamResponse;

  try {
    upstreamResponse = await fetch(url, { cache: 'no-store' });
  } catch (error) {
    return json(
      {
        error: `Unable to reach the air quality service${error?.message ? `: ${error.message}` : '.'}`,
      },
      { status: 502 }
    );
  }

  let payload;

  try {
    payload = await upstreamResponse.json();
  } catch {
    return json({ error: 'Air quality service returned invalid JSON.' }, { status: 502 });
  }

  if (!upstreamResponse.ok) {
    return json(
      {
        error:
          payload?.message ||
          payload?.error ||
          `Air quality request failed with status ${upstreamResponse.status}.`,
      },
      { status: upstreamResponse.status }
    );
  }

  return json(payload);
}
