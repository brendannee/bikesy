import assert from 'node:assert/strict';
import { test } from 'node:test';
import tahoe from '../appConfig/tahoe.js';
import { proxyLegacyRoute } from './legacy-routing.js';
import { BIKESY_ROUTE_URL, requestRoute } from './routing.js';
import { warmupRoutingBackend } from './routing-warmup.js';

// appConfig reads the region at import time; each test file runs in its own process.
process.env.NEXT_PUBLIC_REGION = 'tahoe';
const { GET } = await import('../app/api/route/route.js');

const query = '?lat1=39.1677&lng1=-120.1452&lat2=39.0968&lng2=-120.0324&scenario=2';
const server = 'http://legacy.test';

test('tahoe overrides the API url and keeps a legacy server for every scenario', () => {
  assert.equal(tahoe.BIKESY_API_URL, '/api/route');
  for (const scenario of Object.values(tahoe.SCENARIOS)) {
    assert.match(scenario.server, /^http:\/\/ec2-.*amazonaws\.com$/);
  }
});

test('/api/route proxies scenarios with a configured server and returns its json', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    return Response.json({ path: ['p'] });
  });
  const res = await GET(new Request('https://x.test/api/route' + query));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { path: ['p'] });
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(calls[0].url, `${tahoe.SCENARIOS[2].server}?${query.slice(1)}`);
  assert.equal(calls[0].init.cache, 'no-store');
});

test('/api/route redirects scenarios without a configured server', async () => {
  const res = await GET(new Request('https://x.test/api/route?scenario=9'));
  assert.equal(res.status, 307);
  assert.equal(res.headers.get('Location'), `${BIKESY_ROUTE_URL}?scenario=9`);
});

test('proxy validates input and maps upstream failures', async (t) => {
  const get = (q) =>
    proxyLegacyRoute(new Request('https://x.test/api/route' + q), server, {});
  assert.equal((await get('?lat1=1&scenario=2')).status, 400);

  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('boom');
  });
  assert.equal((await get(query)).status, 502);

  t.mock.method(globalThis, 'fetch', async () => new Response('<html>', { status: 200 }));
  assert.equal((await get(query)).status, 502);

  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: 'nope' }, { status: 500 }),
  );
  const res = await get(query);
  assert.equal(res.status, 500);
  assert.equal((await res.json()).error, 'nope');
});

test('client accepts a relative url and warmup skips it', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url);
    return Response.json({ path: ['p'] });
  });
  globalThis.location = { href: 'https://map.tahoebike.org/' };
  t.after(() => delete globalThis.location);
  await requestRoute({ lat: 1, lng: 2 }, { lat: 3, lng: 4 }, 1, { url: '/api/route' });
  assert.equal(
    calls[0].origin + calls[0].pathname,
    'https://map.tahoebike.org/api/route',
  );
  calls.length = 0;
  await warmupRoutingBackend('', '/api/route');
  assert.equal(calls.length, 0);
});
