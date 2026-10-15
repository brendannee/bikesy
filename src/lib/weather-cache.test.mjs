import assert from 'node:assert/strict';
import { test } from 'node:test';

let version = 0;
const pending = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
for (const [file, method, label, endpoint] of [
  ['weather', 'getWeather', 'Weather', 'weather'],
  ['airquality', 'getAirQuality', 'Air quality', 'air-quality'],
]) {
  const load = async () => (await import(`./${file}.js?test=${version++}`))[method];
  test(`${label}: five-minute TTL starts at success and exact locations stay separate`, async (t) => {
    const get = await load();
    let now = 0;
    t.mock.method(Date, 'now', () => now);
    const urls = [];
    t.mock.method(globalThis, 'fetch', async (url) => {
      urls.push(url);
      return { ok: true, json: async () => ({ location: url, request: urls.length }) };
    });
    const a = await get(37.7, -122.4);
    assert.equal(a.location, `/api/${endpoint}?lat=37.7&lng=-122.4`);
    now = 299999;
    assert.strictEqual(await get('37.7', '-122.4'), a);
    const b = await get(37.71, -122.41);
    assert.notDeepEqual(a, b);
    assert.strictEqual(await get(37.7, -122.4), a);
    now = 300000;
    assert.notStrictEqual(await get(37.7, -122.4), a);
    assert.strictEqual(await get(37.71, -122.41), b);
    assert.equal(urls.length, 3);
  });

  test(`${label}: pending requests deduplicate per location and out-of-order results stay separate`, async (t) => {
    const get = await load();
    let now = 0;
    t.mock.method(Date, 'now', () => now);
    const requests = [];
    t.mock.method(globalThis, 'fetch', (url) => {
      const work = pending();
      requests.push({ url, ...work });
      return work.promise;
    });
    const a = get(1, 2),
      again = get(1, 2),
      b = get(3, 4);
    assert.strictEqual(a, again);
    assert.equal(requests.length, 2);
    now = 5000;
    requests[1].resolve({ ok: true, json: async () => ['B'] });
    assert.deepEqual(await b, ['B']);
    now = 10000;
    requests[0].resolve({ ok: true, json: async () => ['A'] });
    assert.deepEqual(await a, ['A']);
    now = 309999;
    assert.deepEqual(await get(1, 2), ['A']);
    assert.equal(requests.length, 2);
  });

  for (const failure of ['network', 'http', 'json']) {
    test(`${label}: ${failure} failures are not cached, including failed refreshes`, async (t) => {
      const get = await load();
      let now = 0,
        calls = 0;
      t.mock.method(Date, 'now', () => now);
      t.mock.method(globalThis, 'fetch', async () => {
        calls++;
        if (calls === 2) {
          if (failure === 'network') throw Error('offline');
          if (failure === 'http') return { ok: false, status: 429 };
          return {
            ok: true,
            json: async () => {
              throw SyntaxError('invalid JSON');
            },
          };
        }
        return { ok: true, json: async () => ({ calls }) };
      });
      assert.deepEqual(await get(1, 2), { calls: 1 });
      now = 300000;
      await assert.rejects(
        get(1, 2),
        failure === 'http'
          ? new RegExp(`${label} request failed with status 429`)
          : undefined,
      );
      assert.deepEqual(await get(1, 2), { calls: 3 });
      assert.equal(calls, 3);
    });
  }
}
