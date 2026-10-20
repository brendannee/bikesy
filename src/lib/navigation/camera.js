/* global mapboxgl */

// Navigation camera on Bikesy's existing map (see getMap() in lib/map.js): course-up,
// pitched, with the rider in the lower third. The rider's puck glides between fixes
// and its heading eases every animation frame, so the compass can turn it between
// (or without) GPS fixes.
//
// Nothing here runs at import time, so the module is safe to import during SSR.
import { angleDiff, distance } from './geo.js';

const PITCH = 50;
const ZOOM = 17.3;
// The puck sits about 68% of the way down the screen: top padding is 36% of the height.
const TOP_PADDING = 0.36;
// From this width up, the navigation panels sit on the left, 428 px wide (style.css),
// so the puck centers in the map to their right.
const WIDE_SCREEN = 667;
const PANEL_WIDTH = 428;
const NO_PADDING = { top: 0, bottom: 0, left: 0, right: 0 };
const GESTURES = ['dragstart', 'rotatestart', 'pitchstart', 'zoomstart'];

const PUCK_SVG =
  '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#fff"/><circle cx="20" cy="20" r="14" fill="#1d4ed8"/><path d="M20 8l8 20-8-5-8 5z" fill="#fff"/></svg>';

export class FollowCamera {
  // onUserGesture is called when the rider pans, rotates, tilts or zooms the map while
  // it is following; following stays paused until follow(true) (the Recenter button).
  constructor(map, { onUserGesture } = {}) {
    this.map = map;
    this.following = false;
    this.anim = null;
    this.display = null; // { p: [lat, lon], course } as drawn this frame
    this.targetCourse = null;
    this.puck = null;
    this.onGesture = (event) => {
      if (event.originalEvent && this.following) {
        this.following = false;
        onUserGesture?.();
      }
    };
    for (const type of GESTURES) map.on(type, this.onGesture);
    this.loop = this.loop.bind(this);
    this.running = true;
    this.frame = requestAnimationFrame(this.loop);
  }

  showPuck(show) {
    if (show && !this.puck) {
      const element = document.createElement('div');
      element.className = 'nav-puck';
      element.innerHTML = PUCK_SVG;
      this.puck = new mapboxgl.Marker({
        element,
        rotationAlignment: 'map',
        pitchAlignment: 'map',
      })
        .setLngLat([0, 0])
        .addTo(this.map);
    }
    if (show) this.dirty = true;
    if (!show && this.puck) {
      this.puck.remove();
      this.puck = null;
      this.display = null;
      this.targetCourse = null;
    }
  }

  // New fix: animate the puck (and the camera, when following) toward it over `ms`.
  // Position only; heading is separate (setCourse) so the compass can drive it every
  // frame.
  moveTo(p, course, ms = 1000) {
    if (course != null) this.setCourse(course);
    if (!this.display) {
      this.display = { p, course: this.targetCourse ?? 0 };
      this.anim = null;
      this.dirty = true;
      return;
    }
    this.anim = {
      from: this.display.p,
      to: p,
      t0: performance.now(),
      ms: Math.min(ms * 1.05, 2500),
    };
    // A jump (reroute, GPS reacquired) shouldn't glide across the map.
    if (distance(this.display.p, p) > 150) this.anim.ms = 1;
  }

  setCourse(degrees) {
    if (degrees == null || !Number.isFinite(degrees)) return;
    this.targetCourse = ((degrees % 360) + 360) % 360;
    this.dirty = true;
  }

  follow(on = true) {
    this.following = on;
    if (on && this.display) {
      this.map.easeTo({ ...this.camera(this.display), duration: 600 });
      this.easeUntil = performance.now() + 650;
      this.dirty = true;
    }
  }

  camera(display) {
    const { clientWidth: width, clientHeight: height } = this.map.getContainer();
    return {
      center: [display.p[1], display.p[0]],
      bearing: display.course,
      pitch: PITCH,
      zoom: ZOOM,
      padding: {
        ...NO_PADDING,
        top: Math.round(height * TOP_PADDING),
        left: width >= WIDE_SCREEN ? PANEL_WIDTH : 0,
      },
    };
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(100, now - (this.lastFrame ?? now));
    this.lastFrame = now;
    let changed = this.dirty;
    this.dirty = false;
    if (this.anim && this.display) {
      const { from, to, t0, ms } = this.anim;
      const t = Math.min(1, (now - t0) / ms);
      this.display.p = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
      if (t >= 1) this.anim = null;
      changed = true;
    }
    if (this.display && this.targetCourse != null) {
      // Shortest-way exponential easing (wraps 359 -> 0), time constant ~120 ms.
      const diff = angleDiff(this.display.course, this.targetCourse);
      if (Math.abs(diff) > 0.05) {
        const k = 1 - Math.exp(-dt / 120);
        this.display.course =
          (this.display.course + diff * (Math.abs(diff) < 0.5 ? 1 : k) + 360) % 360;
        changed = true;
      }
    }
    if (this.display && this.puck && changed) {
      this.puck.setLngLat([this.display.p[1], this.display.p[0]]);
      this.puck.setRotation(this.display.course);
      if (this.following) {
        // Re-apply once the Recenter ease ends.
        if (this.easeUntil > now) this.dirty = true;
        else this.map.jumpTo(this.camera(this.display));
      }
    }
    this.frame = requestAnimationFrame(this.loop);
  }

  // Show the whole of `points` ([lat, lon][]) north-up and flat, and stop following.
  fit(points, padding) {
    if (!points?.length) return;
    const bounds = new mapboxgl.LngLatBounds();
    points.forEach((p) => bounds.extend([p[1], p[0]]));
    this.following = false;
    // fitBounds fits inside the map's own padding, which follow mode sets.
    this.map.setPadding(NO_PADDING);
    this.map.fitBounds(bounds, {
      padding,
      bearing: 0,
      pitch: 0,
      duration: 800,
      maxZoom: 16,
    });
  }

  // Stop animating; the map and puck stay as they are.
  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  // Stop animating, remove the puck and leave the map flat and north-up.
  destroy() {
    this.stop();
    for (const type of GESTURES) this.map.off(type, this.onGesture);
    this.showPuck(false);
    this.following = false;
    this.map.jumpTo({ pitch: 0, bearing: 0, padding: NO_PADDING });
  }
}
