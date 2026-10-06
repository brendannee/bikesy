import assert from 'node:assert/strict';
import { test } from 'node:test';
import { warmupRoutingBackend } from './routing-warmup.js';
import { readUrlParams } from './url.js';

function parameters(hash, t) {
  const original = globalThis.window;
  globalThis.window = { location: { hash } };
  t.after(() => {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  });
  return readUrlParams();
}

test('a trip in the URL skips health using the existing URL presence check', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => assert.fail('Unexpected health request'));
  await warmupRoutingBackend(parameters('#Start/-122.45,37.77/End/-122.42,37.76/5', t));
  // Warmup does not introduce separate coordinate or scenario validation.
  await warmupRoutingBackend(['Start', 'bad-coordinate', 'End', 'bad-coordinate', '99']);
  assert.equal(fetch.mock.callCount(), 0);
});

test('an empty URL sends one uncached credential-free health GET to the configured backend', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response('ok');
  });
  await warmupRoutingBackend(parameters('', t), 'https://api.bikesy.com/route');
  assert.deepEqual(calls, [{
    url: 'https://api.bikesy.com/health',
    options: { cache: 'no-store', credentials: 'omit' },
  }]);
});

test('a failed warmup is ignored', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  await assert.doesNotReject(warmupRoutingBackend(parameters('', t)));
});
