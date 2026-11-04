/* global mapboxgl, alert */

import _ from 'lodash';
import { length } from '@turf/turf';
import appConfig from '../appConfig';
import { addRouteLayer } from './map-layer-placement.js';

const MAPBOX_DATASETS_API = 'https://api.mapbox.com/datasets/v1';

let map;
let isDragging;
let dragType;
// Until the user or a route moves the map, resizes refit the region, since the map is
// created before its container has its final height.
let isShowingInitialBounds = Boolean(appConfig.INITIAL_BOUNDS);
const INITIAL_BOUNDS_PADDING = 20;
let isCursorOverPoint;
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

let isStartFromQR = false;
export function setIsStartFromQR() {
  isStartFromQR = true;
}

// While navigating, the map belongs to the ride: taps don't place pins, the pins can't
// be dragged and the planned route is hidden behind the ride's own route layers.
let isNavigating = false;

// The map instance, for navigation, which draws on the same map.
export function getMap() {
  return map;
}

export function setNavigationMode(navigating) {
  if (navigating === isNavigating) {
    return;
  }

  isNavigating = navigating;
  if (!map) {
    return;
  }

  if (map.getLayer('path')) {
    map.setLayoutProperty('path', 'visibility', navigating ? 'none' : 'visible');
  }

  if (navigating) {
    isDragging = false;
    isCursorOverPoint = false;
    map.getCanvasContainer().style.cursor = '';
    map.dragPan.enable();
  } else {
    fitBounds();
  }
}

export function drawMap(handleMapClick, handleMarkerDrag) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  function mouseDown(type) {
    if (!isCursorOverPoint || isNavigating) {
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

    // Recopying values as Mapbox returns a non-serializable object
    // by default that causes Redux to blow up.
    const coords = { lat: event.lngLat.lat, lng: event.lngLat.lng };

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
    // When set, bounds overrides center and zoom so the whole region fits any screen size.
    bounds: appConfig.INITIAL_BOUNDS,
    fitBoundsOptions: { padding: INITIAL_BOUNDS_PADDING },
    minZoom: appConfig.MIN_ZOOM,
    style: appConfig.MAPBOX_STYLE_URL,
  });

  // Not movestart, which window resizes also fire with an originalEvent.
  for (const type of ['dragstart', 'rotatestart', 'pitchstart', 'zoomstart']) {
    map.on(type, (e) => {
      if (e.originalEvent) {
        isShowingInitialBounds = false;
      }
    });
  }

  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl());

  const canvas = map.getCanvasContainer();

  map.on('load', () => {
    map.addSource('path', {
      type: 'geojson',
      data: pathGeoJSON,
    });

    addRouteLayer(map, pathLayer);

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

    const mapLayersWithPopup = appConfig.MAP_LAYERS.filter((layer) => layer.popup).map(
      (layer) => layer.label,
    );

    map.on('click', (event) => {
      if (isNavigating) {
        return;
      }

      // Don't trigger this event if there is a marker with a popup at the clicked location
      if (mapLayersWithPopup) {
        const features = map.queryRenderedFeatures(event.point, {
          // Filter prevents error that occurs when specifying hidden layers
          layers: mapLayersWithPopup.filter((layer) => map.getLayer(layer)),
        });

        if (features.length > 0) {
          return;
        }
      }

      // Recopying values as Mapbox returns a non-serializable object
      // by default that causes Redux to blow up.
      handleMapClick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    // When the cursor enters a feature in the point layer, prepare for dragging.
    function markerDragStyle(type) {
      if (isNavigating) {
        return;
      }

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
  return map;
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

    // Only zoom when there's no end marker and no path yet, so we don't
    // override fitBounds when a full route is being drawn.
    const hasEndMarker = endGeoJSON.geometry.coordinates[0] !== 0;
    const hasPath = pathGeoJSON.geometry.coordinates.length > 0;
    if (isStartFromQR && !hasEndMarker && !hasPath) {
      isStartFromQR = false;
      isShowingInitialBounds = false;
      map.flyTo({
        center: [latlng.lng, latlng.lat],
        zoom: appConfig.START_LOCATION_ZOOM,
      });
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
    isShowingInitialBounds = false;
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
        addRouteLayer(map, pathLayer);
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
  if (isShowingInitialBounds) {
    map.fitBounds(appConfig.INITIAL_BOUNDS, {
      padding: INITIAL_BOUNDS_PADDING,
      animate: false,
    });
  } else if (!isNavigating) {
    // While navigating, the follow camera decides what the map shows.
    fitBounds();
  }
}

export function getCenter(point1, point2) {
  return {
    lat: (point1.lat + point2.lat) / 2,
    lng: (point1.lng + point2.lng) / 2,
  };
}

export function getMapboxDatasetURL(datasetId) {
  if (!datasetId) {
    throw Error(`Cannot Fetch Mapbox Dataset URL for datasetId ${datasetId}`);
  }
  return `${MAPBOX_DATASETS_API}/${datasetId}/features?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;
}
