// Map layers for a ride: the route ahead, the part already ridden (grey) and the next
// maneuver point. They go through addRouteLayer, so they sit where the planned route
// does relative to the bike overlays and the start and end pins.
import { addRouteLayer } from '../map-layer-placement.js';
import { pointToSegment } from './geo.js';

const EMPTY = { type: 'FeatureCollection', features: [] };
const lineWidth = (low, high) => ['interpolate', ['linear'], ['zoom'], 12, low, 18, high];
const ROUND = { 'line-cap': 'round', 'line-join': 'round' };

// In drawing order, bottom first.
const LAYERS = [
  {
    id: 'nav-route-casing',
    type: 'line',
    source: 'nav-route',
    paint: { 'line-color': '#b8430a', 'line-width': lineWidth(7, 16) },
    layout: ROUND,
  },
  {
    id: 'nav-route',
    type: 'line',
    source: 'nav-route',
    // The planned route's orange.
    paint: { 'line-color': '#ff6712', 'line-width': lineWidth(5, 12) },
    layout: ROUND,
  },
  {
    id: 'nav-route-done',
    type: 'line',
    source: 'nav-route-done',
    paint: {
      'line-color': '#8f8f8f',
      'line-opacity': 0.75,
      'line-width': lineWidth(4, 10),
    },
    layout: ROUND,
  },
  {
    id: 'nav-maneuver',
    type: 'circle',
    source: 'nav-maneuver',
    paint: {
      'circle-radius': lineWidth(3, 8),
      'circle-color': '#ffffff',
      'circle-stroke-color': '#330066',
      'circle-stroke-width': 3,
      'circle-pitch-alignment': 'map',
    },
  },
];
const SOURCES = ['nav-route', 'nav-route-done', 'nav-maneuver'];

// [lat, lon][] -> GeoJSON LineString feature.
function line(points) {
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: points.map((p) => [p[1], p[0]]) },
  };
}

export class RouteLayers {
  constructor(map) {
    this.map = map;
    this.points = null;
    this.index = 0;
    for (const id of SOURCES) map.addSource(id, { type: 'geojson', data: EMPTY });
    for (const layer of LAYERS) addRouteLayer(map, layer);
  }

  // points: [lat, lon][], or null to clear.
  setRoute(points) {
    this.points = points;
    this.index = 0;
    this.map.getSource('nav-route')?.setData(points ? line(points) : EMPTY);
    this.map.getSource('nav-route-done')?.setData(EMPTY);
  }

  // Grey out the ridden part of the line, splitting it at the snapped position p.
  setProgress(p) {
    const points = this.points;
    if (!points) return;
    let best = { d: Infinity, i: this.index };
    const end = Math.min(points.length - 1, this.index + 200);
    for (let i = Math.max(0, this.index - 2); i < end; i++) {
      const { dist } = pointToSegment(p, points[i], points[i + 1]);
      if (dist < best.d) best = { d: dist, i };
    }
    if (best.d > 30) return; // off route: leave as is
    this.index = best.i;
    this.map
      .getSource('nav-route-done')
      ?.setData(line([...points.slice(0, best.i + 1), p]));
    this.map.getSource('nav-route')?.setData(line([p, ...points.slice(best.i + 1)]));
  }

  // coordinate: { lat, lng } of the next maneuver, or null.
  setManeuver(coordinate) {
    this.map.getSource('nav-maneuver')?.setData(
      coordinate
        ? {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [coordinate.lng, coordinate.lat] },
          }
        : EMPTY,
    );
  }

  remove() {
    for (const { id } of LAYERS) {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    }
    for (const id of SOURCES) {
      if (this.map.getSource(id)) this.map.removeSource(id);
    }
  }
}
