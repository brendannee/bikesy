/* global mapboxgl, alert */

import _ from 'lodash';
import { length } from '@turf/turf';
import appConfig from 'appConfig';

let map;
let isDragging;
let dragType;
let isCursorOverPoint;
let mouseOverMarker = false;
const startLayer = {
  id: 'start',
  type: 'circle',
  source: 'start',
  paint: {
    'circle-radius': 12,
    'circle-color': '#19b566',
    'circle-stroke-color': '#0d5731',
    'circle-stroke-width': 1,
  },
};

const endLayer = {
  id: 'end',
  type: 'circle',
  source: 'end',
  paint: {
    'circle-radius': 12,
    'circle-color': '#cf3043',
    'circle-stroke-color': '#58131c',
    'circle-stroke-width': 1,
  },
};

const pathLayer = {
  id: 'path',
  type: 'line',
  source: 'path',
  paint: {
    'line-color': '#ff6712',
    'line-opacity': 0.8,
    'line-width': 8,
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

const startGeoJSON = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [0, 0],
  },
};

const endGeoJSON = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [0, 0],
  },
};

const pathGeoJSON = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [],
  },
};

export function drawMap(handleMapClick, handleMarkerDrag) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  function mouseDown(type) {
    if (!isCursorOverPoint) {
      return;
    }

    dragType = type;
    isDragging = true;

    // Set a cursor indicator
    canvas.style.cursor = 'grab';

    // Mouse events
    map.on('mousemove', onMove);
    map.once('mouseup', onUp);
    map.on('touchmove', onMove);
    map.once('touchend', onUp);
  }

  function onMove(event) {
    if (!isDragging) {
      return;
    }

    const coords = event.lngLat;

    // Set a UI indicator for dragging.
    canvas.style.cursor = 'grabbing';

    // Update the Point feature in `geojson` coordinates
    // and call setData to the source layer `point` on it.
    startGeoJSON.geometry.coordinates = [coords.lng, coords.lat];
    map.getSource(dragType).setData(startGeoJSON);
  }

  function onUp(event) {
    if (!isDragging) {
      return;
    }

    const coords = event.lngLat;

    handleMarkerDrag(coords, dragType);

    canvas.style.cursor = '';
    isDragging = false;

    // Unbind mouse events
    map.off('mousemove', onMove);
    map.off('touchmove', onMove);
  }

  map = new mapboxgl.Map({
    container: 'map',
    center: [appConfig.INITIAL_CENTER_LNG, appConfig.INITIAL_CENTER_LAT],
    zoom: appConfig.INITIAL_ZOOM,
    minZoom: appConfig.MIN_ZOOM,
    style: appConfig.MAPBOX_STYLE_URL,
  });

  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl());

  const canvas = map.getCanvasContainer();

  map.on('load', () => {
    // Find the index of the first symbol layer in the map style
    let firstSymbolId;
    for (const layer of map.getStyle().layers) {
      if (layer.type === 'symbol') {
        firstSymbolId = layer.id;
        break;
      }
    }

    map.addSource('path', {
      type: 'geojson',
      data: pathGeoJSON,
    });

    map.addLayer(pathLayer, firstSymbolId);

    map.addSource('start', {
      type: 'geojson',
      data: startGeoJSON,
    });

    if (startGeoJSON.geometry.coordinates[0] !== 0) {
      map.addLayer(startLayer);
    }

    map.addSource('end', {
      type: 'geojson',
      data: endGeoJSON,
    });

    if (endGeoJSON.geometry.coordinates[0] !== 0) {
      map.addLayer(endLayer);
    }

    map.on('click', (event) => {
      if (mouseOverMarker) {
        return;
      }

      handleMapClick(event.lngLat);
    });

    // When the cursor enters a feature in the point layer, prepare for dragging.
    function markerDragStyle(type) {
      map.setPaintProperty(type, 'circle-color', '#3bb2d0');
      canvas.style.cursor = 'move';
      isCursorOverPoint = true;
      map.dragPan.disable();
    }

    function markerNormalStyle(type) {
      const color = type === 'start' ? '#19b566' : '#cf3043';
      map.setPaintProperty(type, 'circle-color', color);
      canvas.style.cursor = '';
      isCursorOverPoint = false;
      map.dragPan.enable();
    }

    map.on('mouseenter', 'start', () => markerDragStyle('start'));
    map.on('mouseleave', 'start', () => markerNormalStyle('start'));
    map.on('mouseenter', 'end', () => markerDragStyle('end'));
    map.on('mouseleave', 'end', () => markerNormalStyle('end'));

    map.on('mousedown', 'start', () => mouseDown('start'));
    map.on('mousedown', 'end', () => mouseDown('end'));
    map.on('touchstart', 'start', () => mouseDown('start'));
    map.on('touchstart', 'end', () => mouseDown('end'));
  });
}

export function updateStartMarker(latlng) {
  if (!map) {
    return;
  }

  if (latlng) {
    startGeoJSON.geometry.coordinates = [latlng.lng, latlng.lat];
    if (map.getSource('start')) {
      map.getSource('start').setData(startGeoJSON);
      if (!map.getLayer('start')) {
        map.addLayer(startLayer);
      }
    }
  } else if (map.getLayer('start')) {
    map.removeLayer('start');
  }
}

export function updateEndMarker(latlng) {
  if (!map) {
    return;
  }

  if (latlng) {
    endGeoJSON.geometry.coordinates = [latlng.lng, latlng.lat];
    if (map.getSource('end')) {
      map.getSource('end').setData(endGeoJSON);
      if (!map.getLayer('end')) {
        map.addLayer(endLayer);
      }
    }
  } else if (map.getLayer('end')) {
    map.removeLayer('end');
  }
}

function fitBounds() {
  const bounds = pathGeoJSON.geometry.coordinates.reduce((bounds, coord) => {
    return bounds.extend(coord);
  }, new mapboxgl.LngLatBounds());

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 40 });
  }
}

export function updatePath(path) {
  if (!map) {
    return;
  }

  if (path) {
    pathGeoJSON.geometry = path;
    if (map.getSource('path')) {
      map.getSource('path').setData(pathGeoJSON);
      if (!map.getLayer('path')) {
        // Find the index of the first symbol layer in the map style
        let firstSymbolId;
        for (const layer of map.getStyle().layers) {
          if (layer.type === 'symbol') {
            firstSymbolId = layer.id;
            break;
          }
        }
        map.addLayer(pathLayer, firstSymbolId);
      }
    }

    fitBounds();
  } else if (map.getLayer('path')) {
    map.removeLayer('path');
  }
}

export function latlngIsWithinBounds(latlng, type) {
  const isWithinBounds =
    latlng.lat <= appConfig.SEARCH_BOUNDS.TOP &&
    latlng.lat >= appConfig.SEARCH_BOUNDS.BOTTOM &&
    latlng.lng <= appConfig.SEARCH_BOUNDS.RIGHT &&
    latlng.lng >= appConfig.SEARCH_BOUNDS.LEFT;
  if (!isWithinBounds) {
    let alertText = appConfig.SEARCH_BOUNDS.ALERT_TEXT;
    if (type === 'start') {
      alertText += ' Change your start address and try again.';
    } else if (type === 'end') {
      alertText += ' Change your end address and try again.';
    }

    alert(alertText);
  }

  return isWithinBounds;
}

export function getPathDistance(path) {
  return length(path, { units: 'miles' });
}

export function updateMapSize() {
  if (!map) {
    return;
  }

  map.resize();
  fitBounds();
}

export function getCenter(point1, point2) {
  return {
    lat: (point1.lat + point2.lat) / 2,
    lng: (point1.lng + point2.lng) / 2,
  };
}
