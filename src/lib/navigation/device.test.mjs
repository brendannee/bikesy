import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DeviceLocation,
  currentFix,
  fixFromPosition,
  keepScreenOn,
  releaseDevice,
  speech,
  wakeLockSupported,
} from './device.js';
import { compass, enableCompass } from './heading.js';

// Install fake browser globals for one test and put the originals back afterwards.
function stubGlobals(t, stubs) {
  for (const [name, value] of Object.entries(stubs)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, {
      value,
      configurable: true,
      writable: true,
    });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  }
}

const position = (coords, timestamp = 1234) => ({ coords, timestamp });

// --- GPS ---------------------------------------------------------------------

test('fixFromPosition: GPS course is passed on only when moving faster than 2 m/s', () => {
  const base = { latitude: 38.9, longitude: -120, accuracy: 8 };
  const moving = fixFromPosition(position({ ...base, heading: 90, speed: 5 }));
  assert.deepEqual(moving, {
    lat: 38.9,
    lng: -120,
    accuracy: 8,
    course: 90,
    rawHeading: 90,
    speed: 5,
    timestamp: 1234,
  });
  assert.equal(
    fixFromPosition(position({ ...base, heading: 90, speed: 2.01 })).course,
    90,
  );
  assert.equal(
    fixFromPosition(position({ ...base, heading: 90, speed: 2 })).course,
    null,
  );
  assert.equal(fixFromPosition(position({ ...base, heading: 0, speed: 3 })).course, 0);
});

test('fixFromPosition: stationary or invalid headings never become a course', () => {
  const base = { latitude: 38.9, longitude: -120, accuracy: 8, speed: 5 };
  for (const heading of [NaN, null, -1, undefined, Infinity]) {
    const fix = fixFromPosition(position({ ...base, heading }));
    assert.equal(fix.course, null, `heading ${heading}`);
  }
  // No speed reported (some browsers) means we can't trust the heading either.
  assert.equal(
    fixFromPosition(position({ ...base, heading: 45, speed: null })).course,
    null,
  );
  assert.equal(
    fixFromPosition(position({ ...base, heading: 45, speed: NaN })).course,
    null,
  );
  // The raw values are kept for the debug readout.
  const raw = fixFromPosition(position({ ...base, heading: -1, speed: 0.3 }));
  assert.equal(raw.rawHeading, -1);
  assert.equal(raw.speed, 0.3);
});

test('DeviceLocation: watches with high accuracy, no timeout, and forwards fixes', (t) => {
  const watch = [];
  const cleared = [];
  stubGlobals(t, {
    navigator: {
      geolocation: {
        watchPosition: (ok, fail, options) => (watch.push({ ok, fail, options }), 42),
        clearWatch: (id) => cleared.push(id),
      },
    },
  });
  const fixes = [];
  const errors = [];
  const gps = new DeviceLocation(
    (fix) => fixes.push(fix),
    (err) => errors.push(err),
  );
  gps.start();
  assert.equal(watch.length, 1);
  assert.deepEqual(watch[0].options, { enableHighAccuracy: true, maximumAge: 0 });
  assert.equal(gps.watchId, 42);

  watch[0].ok(
    position({ latitude: 1, longitude: 2, accuracy: 5, heading: 10, speed: 4 }),
  );
  assert.equal(fixes.length, 1);
  assert.equal(fixes[0].course, 10);

  gps.stop();
  assert.deepEqual(cleared, [42]);
  assert.equal(gps.watchId, null);
  gps.stop(); // harmless
  assert.deepEqual(cleared, [42]);
});

test('DeviceLocation: errors become Error objects with a readable message', (t) => {
  let fail;
  stubGlobals(t, {
    navigator: {
      geolocation: { watchPosition: (ok, f) => ((fail = f), 1), clearWatch() {} },
    },
  });
  const errors = [];
  new DeviceLocation(
    () => {},
    (err) => errors.push(err.message),
  ).start();
  fail({ code: 1, message: '' });
  fail({ code: 2 });
  fail({ code: 3 });
  fail({ code: 9 });
  fail({ code: 1, message: 'User denied Geolocation' });
  assert.deepEqual(errors, [
    'permission denied',
    'position unavailable',
    'timed out',
    'unknown error',
    'User denied Geolocation',
  ]);
});

test('currentFix: one high-accuracy fix, null when none comes in time, and refusal rejects', async (t) => {
  const requests = [];
  stubGlobals(t, {
    navigator: {
      geolocation: {
        getCurrentPosition: (ok, fail, options) => requests.push({ ok, fail, options }),
      },
    },
  });
  const located = currentFix();
  assert.deepEqual(requests[0].options, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
  });
  requests[0].ok(position({ latitude: 1, longitude: 2, accuracy: 5, speed: 0 }));
  assert.equal((await located).lat, 1);

  const timedOut = currentFix({ timeout: 50 });
  assert.equal(requests[1].options.timeout, 50);
  requests[1].fail({ code: 3 });
  assert.equal(await timedOut, null);

  const unavailable = currentFix();
  requests[2].fail({ code: 2 });
  assert.equal(await unavailable, null);

  const refused = currentFix();
  requests[3].fail({ code: 1 });
  await assert.rejects(refused, /use your location/);
});

test('currentFix rejects without geolocation', async (t) => {
  stubGlobals(t, { navigator: {} });
  await assert.rejects(currentFix(), /not available/);
});

test('DeviceLocation: reports when geolocation is unavailable', (t) => {
  stubGlobals(t, { navigator: {} });
  const errors = [];
  new DeviceLocation(
    () => {},
    (err) => errors.push(err.message),
  ).start();
  assert.deepEqual(errors, ['Geolocation is not available in this browser.']);
});

// --- Speech ------------------------------------------------------------------

function fakeSpeech(t) {
  const log = [];
  class SpeechSynthesisUtterance {
    constructor(text) {
      this.text = text;
    }
  }
  stubGlobals(t, {
    SpeechSynthesisUtterance,
    window: {
      speechSynthesis: {
        speak: (u) => log.push(['speak', u]),
        cancel: () => log.push(['cancel']),
      },
    },
  });
  speech.reset();
  speech.enabled = true;
  log.length = 0;
  t.after(() => {
    speech.spoken.clear();
    speech.listeners.clear();
    speech.enabled = true;
  });
  return log;
}

test('speech.say: cancels what is playing, speaks in US English at 1.05x, once per id', (t) => {
  const log = fakeSpeech(t);
  speech.say('Turn left onto Ruth Avenue.', 'u1');
  assert.equal(log[0][0], 'cancel');
  const [, utterance] = log[1];
  assert.equal(utterance.text, 'Turn left onto Ruth Avenue.');
  assert.equal(utterance.lang, 'en-US');
  assert.equal(utterance.rate, 1.05);

  // GPS jitter re-triggering the same prompt is ignored...
  speech.say('Turn left onto Ruth Avenue.', 'u1');
  assert.equal(log.length, 2);
  // ...and the text is the id when none is given.
  speech.say('Rerouting.');
  speech.say('Rerouting.');
  assert.equal(log.filter(([kind]) => kind === 'speak').length, 2);
  // A falsy id always speaks.
  speech.say('Again', null);
  speech.say('Again', null);
  assert.equal(log.filter(([kind]) => kind === 'speak').length, 4);
});

test('speech.say: listeners hear every prompt, even when muted', (t) => {
  const log = fakeSpeech(t);
  const heard = [];
  const off = speech.onSay((text) => heard.push(text));
  speech.setEnabled(false);
  assert.deepEqual(log, [['cancel']]);
  log.length = 0;
  speech.say('Silent caption', 'c1');
  assert.deepEqual(heard, ['Silent caption']);
  assert.deepEqual(log, []);

  speech.setEnabled(true);
  speech.say('Spoken caption', 'c2');
  assert.deepEqual(heard, ['Silent caption', 'Spoken caption']);
  off();
  speech.say('Unheard', 'c3');
  assert.equal(heard.length, 2);
});

test('speech.unlock speaks a silent utterance, and reset forgets what was said', (t) => {
  const log = fakeSpeech(t);
  speech.unlock();
  assert.equal(log.length, 1);
  assert.equal(log[0][1].volume, 0);
  speech.say('Hello', 'h');
  log.length = 0;
  speech.reset();
  assert.deepEqual(log, [['cancel']]);
  speech.say('Hello', 'h');
  assert.equal(log.filter(([kind]) => kind === 'speak').length, 1);
});

test('speech without speechSynthesis still notifies listeners and does not throw', (t) => {
  stubGlobals(t, { window: {} });
  const heard = [];
  speech.onSay((text) => heard.push(text));
  t.after(() => speech.listeners.clear());
  speech.unlock();
  speech.say('No voice here', 'nv');
  speech.reset();
  speech.setEnabled(false);
  speech.setEnabled(true);
  assert.deepEqual(heard, ['No voice here']);
});

// --- Wake lock -----------------------------------------------------------------

function fakeWakeLock(t, { supported = true, visibility = 'visible' } = {}) {
  const doc = {
    visibilityState: visibility,
    handlers: new Set(),
    addEventListener: (type, fn) => type === 'visibilitychange' && doc.handlers.add(fn),
    removeEventListener: (type, fn) =>
      type === 'visibilitychange' && doc.handlers.delete(fn),
    show() {
      doc.visibilityState = 'visible';
      for (const fn of doc.handlers) fn();
    },
    hide() {
      doc.visibilityState = 'hidden';
      for (const sentinel of sentinels) sentinel.released = true; // the browser drops the lock
      for (const fn of doc.handlers) fn();
    },
  };
  const sentinels = [];
  const nav = supported
    ? {
        wakeLock: {
          request: async (type) => {
            const sentinel = {
              type,
              released: false,
              release: async () => {
                sentinel.released = true;
              },
            };
            sentinels.push(sentinel);
            return sentinel;
          },
        },
      }
    : {};
  // Registered first so it runs before the globals are put back.
  t.after(() => keepScreenOn(false));
  stubGlobals(t, { document: doc, navigator: nav });
  return { doc, sentinels };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('keepScreenOn acquires a screen wake lock and releases it when turned off', async (t) => {
  const { doc, sentinels } = fakeWakeLock(t);
  assert.equal(wakeLockSupported(), true);
  keepScreenOn(true);
  await settle();
  assert.equal(sentinels.length, 1);
  assert.equal(sentinels[0].type, 'screen');
  assert.equal(doc.handlers.size, 1);

  keepScreenOn(false);
  assert.equal(sentinels[0].released, true);
  assert.equal(doc.handlers.size, 0);
});

test('keepScreenOn re-acquires the lock when the page becomes visible again', async (t) => {
  const { doc, sentinels } = fakeWakeLock(t);
  keepScreenOn(true);
  await settle();
  doc.hide();
  await settle();
  assert.equal(sentinels.length, 1); // nothing to acquire while hidden
  doc.show();
  await settle();
  assert.equal(sentinels.length, 2);
  assert.equal(sentinels[1].released, false);
  // Becoming visible while the lock is still held does not take a second one.
  doc.show();
  await settle();
  assert.equal(sentinels.length, 2);
});

test('keepScreenOn(true) twice holds only one lock, and no re-acquire after turning off', async (t) => {
  const { doc, sentinels } = fakeWakeLock(t);
  keepScreenOn(true);
  keepScreenOn(true);
  await settle();
  assert.equal(sentinels.length, 1);
  assert.equal(doc.handlers.size, 1);
  keepScreenOn(false);
  doc.show();
  await settle();
  assert.equal(sentinels.length, 1);
});

test('turning the screen lock off while the request is pending releases the lock', async (t) => {
  const { sentinels } = fakeWakeLock(t);
  keepScreenOn(true);
  keepScreenOn(false);
  await settle();
  assert.equal(sentinels.length, 1);
  assert.equal(sentinels[0].released, true);
});

test('a browser without Screen Wake Lock is reported and tolerated', async (t) => {
  const { sentinels } = fakeWakeLock(t, { supported: false });
  assert.equal(wakeLockSupported(), false);
  keepScreenOn(true);
  await settle();
  assert.equal(sentinels.length, 0);
  keepScreenOn(false);
});

test('releaseDevice lets go of the wake lock, the compass and spoken prompts', async (t) => {
  const { doc, sentinels } = fakeWakeLock(t);
  const listeners = new Set();
  stubGlobals(t, {
    window: {
      DeviceOrientationEvent: function DeviceOrientationEvent() {},
      addEventListener: (type) => listeners.add(type),
      removeEventListener: (type) => listeners.delete(type),
    },
  });
  keepScreenOn(true);
  await enableCompass();
  speech.say('Turn left.', 'left');
  await settle();
  assert.equal(sentinels.length, 1);
  assert.deepEqual([...listeners], ['deviceorientation']);

  releaseDevice();
  assert.equal(sentinels[0].released, true);
  assert.equal(doc.handlers.size, 0);
  assert.equal(listeners.size, 0);
  assert.equal(compass.status, 'off');
  assert.equal(speech.spoken.size, 0);
});
