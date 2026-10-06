import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BIKESY_ROUTE_URL, requestRoute } from './routing.js';
import defaults from '../appConfig/defaults.js';
import sf from '../appConfig/sf.js';
import { GET, HEAD, OPTIONS } from '../app/api/route/route.js';
import * as mobile from '../app/api.php/route.js';

const start = { lat: 37.77201183539485, lng: -122.45188647879988 };
const end = { lat: 37.761314357988724, lng: -122.42157490354151 };

test('actual compatibility handlers preserve complete queries and backend defaults in a temporary redirect', () => {
  for (const query of [
    '',
    '?lat1=37.77201&lng1=-122.45189&lat2=37.76131&lng2=-122.42157',
    '?scenario=&tag=a%20b&tag=c%2Fd&next=https%3A%2F%2Fexample.com',
  ]) {
    for (const handler of [GET, HEAD, mobile.GET, mobile.HEAD]) {
      const result = handler(new Request('https://bikesy.com/api/route' + query));
      assert.equal(result.status, 307);
      assert.equal(result.headers.get('Location'), BIKESY_ROUTE_URL + query);
      assert.equal(result.headers.get('Cache-Control'), 'no-store');
      assert.equal(result.headers.get('Access-Control-Allow-Origin'), '*');
      assert.equal(result.body, null);
    }
  }
  for (const handler of [OPTIONS, mobile.OPTIONS]) {
    const result = handler();
    assert.equal(result.status, 204);
    assert.equal(result.headers.get('Access-Control-Allow-Methods'), 'GET,HEAD,OPTIONS');
  }
});

test('all nine web selections request the new server with unchanged mapping and full coordinate precision', async (t) => {
  assert.equal(defaults.BIKESY_API_URL, BIKESY_ROUTE_URL);
  assert.equal(sf.DEFAULT_SCENARIO, '5');
  const calls = [];
  const payload = { path: ['encoded', 'levels'], directions: [], elevation_profile: [] };
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    return Response.json(payload);
  });
  const controller = new AbortController();
  for (let scenario = 1; scenario <= 9; scenario++) {
    assert.equal(sf.SCENARIOS[scenario].hillReluctance, String(((scenario - 1) % 3) + 1));
    assert.equal(
      sf.SCENARIOS[scenario].routeType,
      String(3 - Math.floor((scenario - 1) / 3)),
    );
    assert.deepEqual(
      await requestRoute(start, end, scenario, { signal: controller.signal }),
      payload,
    );
    const { url, init } = calls.at(-1);
    assert.equal(url.origin + url.pathname, BIKESY_ROUTE_URL);
    assert.equal(url.searchParams.get('scenario'), String(scenario));
    assert.equal(url.searchParams.get('lat1'), String(start.lat));
    assert.equal(url.searchParams.get('lng2'), String(end.lng));
    assert.equal(init.signal, controller.signal);
    assert.equal(init.credentials, 'omit');
  }
  for (const scenario of [undefined, null, '']) {
    await requestRoute(start, end, scenario);
    assert.equal(calls.at(-1).url.searchParams.has('scenario'), false);
  }
});

test('HTTP-200 error envelopes, non-JSON and HTTP failures reject without inventing a route', async (t) => {
  let response;
  t.mock.method(globalThis, 'fetch', async () => response);
  response = Response.json({ error: 'No route found' });
  await assert.rejects(requestRoute(start, end, 5), /No route found/);
  response = Response.json({ error: 'Routing service busy' }, { status: 503 });
  await assert.rejects(requestRoute(start, end, 5), /Routing service busy/);
  response = new Response('<html>Gateway failure</html>', { status: 502 });
  await assert.rejects(requestRoute(start, end, 5), /invalid JSON/);
  response = Response.json({}, { status: 504 });
  await assert.rejects(requestRoute(start, end, 5), /status 504/);
});

test('cancellation reaches an in-flight fetch and is retained during response-body reading', async (t) => {
  const controller = new AbortController();
  let started;
  const pending = new Promise((resolve) => {
    started = resolve;
  });
  t.mock.method(
    globalThis,
    'fetch',
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        started();
      }),
  );
  const result = requestRoute(start, end, 5, { signal: controller.signal });
  await pending;
  controller.abort();
  await assert.rejects(result, (error) => error.name === 'AbortError');
  t.mock.method(globalThis, 'fetch', async () => ({
    json: async () => {
      throw controller.signal.reason;
    },
  }));
  await assert.rejects(
    requestRoute(start, end, 5, { signal: controller.signal }),
    (error) => error.name === 'AbortError',
  );
});
