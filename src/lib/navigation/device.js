// Phone-side plumbing: speech, real GPS and screen wake lock. (The compass lives in
// heading.js.)
//
// Nothing here touches `window`, `document` or `navigator` at import time, so the
// module is safe to import during SSR; every access happens inside a function.
import { MIN_COURSE_SPEED } from './heading.js';

// --- Speech (Web Speech API) --------------------------------------------------
function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export const speech = {
  enabled: true,
  spoken: new Set(),
  listeners: new Set(),
  // iOS only allows speech after a user gesture: call this from the Start tap.
  unlock() {
    if (!speechSupported()) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  },
  // `id` de-duplicates: GPS jitter can re-trigger an earlier prompt. Pass a falsy id
  // to speak the same text again.
  say(text, id = text) {
    if (id && this.spoken.has(id)) return;
    if (id) this.spoken.add(id);
    // Listeners (e.g. an on-screen caption) hear every prompt, even when muted.
    for (const fn of this.listeners) fn(text);
    if (!this.enabled || !speechSupported()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  },
  // Subscribe to prompts as they are said; returns an unsubscribe function.
  onSay(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
  setEnabled(on) {
    this.enabled = on;
    if (!on && speechSupported()) window.speechSynthesis.cancel();
  },
  reset() {
    this.spoken.clear();
    if (speechSupported()) window.speechSynthesis.cancel();
  },
};

// --- Screen wake lock ------------------------------------------------------------
// GPS stops when the screen locks on mobile web, so keep it on while riding.
let wakeLock = null;
let wantWake = false;

export function wakeLockSupported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

const wakeLockHeld = () => !!wakeLock && !wakeLock.released;
let acquiring = false;

async function acquire() {
  if (acquiring) return;
  acquiring = true;
  try {
    if (
      wantWake &&
      !wakeLockHeld() &&
      wakeLockSupported() &&
      document.visibilityState === 'visible'
    ) {
      const lock = await navigator.wakeLock.request('screen');
      // If it was turned off while the request was pending, give the lock back.
      if (wantWake) wakeLock = lock;
      else lock.release().catch(() => {});
    }
  } catch (e) {
    console.warn('Wake lock failed', e);
  } finally {
    acquiring = false;
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible' && wantWake) acquire(); // lock is dropped when hidden
}

export function keepScreenOn(on) {
  wantWake = on;
  if (on) {
    // Re-acquire after the page was hidden; adding the same listener twice is a no-op.
    document.addEventListener('visibilitychange', onVisibilityChange);
    acquire();
  } else {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    wakeLock?.release().catch(() => {});
    wakeLock = null;
  }
}

// --- Real GPS ---------------------------------------------------------------------

// A geolocation position -> the fix shape shared with Simulator:
// { lat, lng, accuracy, course, rawHeading, speed, timestamp }
export function fixFromPosition(pos) {
  const { latitude, longitude, accuracy, heading, speed } = pos.coords;
  // GPS course is only trustworthy while actually moving. Stationary fixes
  // report heading NaN/null (Chrome) or -1 (iOS), and noisy speed, so require
  // a real heading and > 2 m/s. No last-course reuse here: heading choice
  // (GPS vs compass vs hold) happens in chooseHeading.
  const validHeading = heading != null && Number.isFinite(heading) && heading >= 0;
  const moving = speed != null && Number.isFinite(speed) && speed > MIN_COURSE_SPEED;
  return {
    lat: latitude,
    lng: longitude,
    accuracy,
    course: validHeading && moving ? heading : null,
    rawHeading: heading,
    speed,
    timestamp: pos.timestamp,
  };
}

export class DeviceLocation {
  constructor(onLocation, onError) {
    this.onLocation = onLocation;
    this.onError = onError;
    this.watchId = null;
  }
  start() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.onError(new Error('Geolocation is not available in this browser.'));
      return;
    }
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.onLocation(fixFromPosition(pos)),
      (err) => {
        // No `timeout`: standing still, phones can go >20 s without a new fix,
        // which would raise TIMEOUT errors while nothing is wrong.
        const names = {
          1: 'permission denied',
          2: 'position unavailable',
          3: 'timed out',
        };
        this.onError(new Error(err.message || names[err.code] || 'unknown error'));
      },
      { enableHighAccuracy: true, maximumAge: 0 },
    );
  }
  stop() {
    if (this.watchId != null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }
}
