import { NextResponse } from 'next/server';

import appConfig from '../../../appConfig';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
};

function json(data, init) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...init?.headers,
    },
  });
}

function getServerUrl(scenario) {
  return appConfig.SCENARIOS[scenario]?.server;
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const lat1 = searchParams.get('lat1');
  const lng1 = searchParams.get('lng1');
  const lat2 = searchParams.get('lat2');
  const lng2 = searchParams.get('lng2');
  const scenario = searchParams.get('scenario');

  if (!lat1 || !lng1 || !lat2 || !lng2 || !scenario) {
    return json(
      {
        error: 'lat1, lng1, lat2, lng2, and scenario are required.',
      },
      { status: 400 }
    );
  }

  const server = getServerUrl(scenario);

  if (!server) {
    return json({ error: 'Invalid scenario.' }, { status: 400 });
  }

  const url = `${server}?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}&scenario=${scenario}`;

  let upstreamResponse;

  try {
    upstreamResponse = await fetch(url, { cache: 'no-store' });
  } catch (error) {
    return json(
      {
        error: `Unable to reach the routing service${error?.message ? `: ${error.message}` : '.'}`,
      },
      { status: 502 }
    );
  }

  let payload;

  try {
    payload = await upstreamResponse.json();
  } catch {
    return json({ error: 'Routing service returned invalid JSON.' }, { status: 502 });
  }

  if (!upstreamResponse.ok) {
    return json(
      {
        error:
          payload?.error ||
          payload?.message ||
          `Routing service failed with status ${upstreamResponse.status}.`,
      },
      { status: upstreamResponse.status }
    );
  }

  return json(payload);
}
