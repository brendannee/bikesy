const _ = require('lodash');
const config = require('../frontendconfig.json');
const error = require('./error');
const autoLink = require('auto-link');
const turf = require('@turf/turf');

import 'whatwg-fetch';

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
    'circle-stroke-width': 1
  }
};

const endLayer = {
  id: 'end',
  type: 'circle',
  source: 'end',
  paint: {
    'circle-radius': 12,
    'circle-color': '#cf3043',
    'circle-stroke-color': '#58131c',
    'circle-stroke-width': 1
  }
};

const pathLayer = {
  id: 'path',
  type: 'line',
  source: 'path',
  paint: {
    'line-color': '#ff6712',
    'line-opacity': 0.8,
    'line-width': 6
  }
};

const lockersLayer = {
  id: 'lockers',
  type: 'circle',
  source: 'lockers',
  paint: {
    'circle-radius': 8,
    'circle-color': '#f41cf1',
    'circle-stroke-color': '#530a52',
    'circle-stroke-width': 1
  }
};

const startGeoJSON = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [0,0]
  }
};

const endGeoJSON = {
  type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [0,0]
    }
};

const pathGeoJSON = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: []
  }
};

export function drawMap(handleMapClick, handleMarkerDrag) {
  mapboxgl.accessToken = config.mapboxAccessToken;

  function mouseDown(type) {
    if (!isCursorOverPoint){
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

  function onMove(e) {
    if (!isDragging) return;
    const coords = e.lngLat;

    // Set a UI indicator for dragging.
    canvas.style.cursor = 'grabbing';

    // Update the Point feature in `geojson` coordinates
    // and call setData to the source layer `point` on it.
    startGeoJSON.geometry.coordinates = [coords.lng, coords.lat];
    map.getSource(dragType).setData(startGeoJSON);
  }

  function onUp(e) {
    if (!isDragging) {
      return;
    }
    const coords = e.lngLat;

    handleMarkerDrag(coords, dragType);

    canvas.style.cursor = '';
    isDragging = false;

    // Unbind mouse events
    map.off('mousemove', onMove);
    map.off('touchmove', onMove);
  }

  map = new mapboxgl.Map({
    container: 'map',
    center: [config.initialCenterLng, config.initialCenterLat],
    zoom: config.initialZoom,
    minZoom: config.minZoom,
    style: 'mapbox://styles/bikesy/cisrx1j8h00022wqa7n21sddv'
  });

  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl());

  var canvas = map.getCanvasContainer();

  map.on('load', function() {
    map.addSource('path', {
      type: 'geojson',
      data: pathGeoJSON
    });

    map.addLayer(pathLayer);

    map.addSource('start', {
      type: 'geojson',
      data: startGeoJSON
    });

    if (startGeoJSON.geometry.coordinates[0] !== 0) {
      map.addLayer(startLayer);
    }

    map.addSource('end', {
      type: 'geojson',
      data: endGeoJSON
    });

    if (endGeoJSON.geometry.coordinates[0] !== 0) {
      map.addLayer(endLayer);
    }

    map.on('click', e => {
      if (mouseOverMarker) {
        return;
      }

      handleMapClick(e.lngLat);
    });

    // When the cursor enters a feature in the point layer, prepare for dragging.
    function markerDragStyle(type) {
      map.setPaintProperty(type, 'circle-color', '#3bb2d0');
      canvas.style.cursor = 'move';
      isCursorOverPoint = true;
      map.dragPan.disable();
    }

    function markerNormalStyle(type) {
      var color = type === 'start' ? '#19b566' : '#cf3043';
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

  // Bike Lockers layer
  const lockersDatasetID = 'bikesy/cjdr13xe624z133qhr55la61v';
  fetch(`https://api.mapbox.com/datasets/v1/${lockersDatasetID}/features?access_token=${config.mapboxAccessToken}`)
  .then(response => response.json())
  .then(geojson => {
    // Only show bike lockers
    const lockersGeoJSON = {
      type: 'FeatureCollection',
      features: _.filter(geojson.features, feature => feature.properties.type === 'locker')
    };

    lockersGeoJSON.features.forEach(feature => {
      feature.properties.description = `<strong>${feature.properties.quantity} Lockers</strong><br>${autoLink.link(feature.properties.description)}`;
    });

    map.addSource('lockers', {
      type: 'geojson',
      data: lockersGeoJSON
    });

    map.on('click', 'lockers', e => {
      var coordinates = e.features[0].geometry.coordinates.slice();
      var description = '<div><b>' + e.features[0].properties.Name + '</b></div>';
      description += '<div>' + e.features[0].properties.description + '</div>';

      // Ensure that if the map is zoomed out such that multiple copies of the
      // feature are visible, the popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);
    });

    map.on('mouseenter', 'lockers', () => {
      map.setPaintProperty('lockers', 'circle-color', '#f55ef3');
      canvas.style.cursor = 'pointer';
      mouseOverMarker = true;
    });

    map.on('mouseleave', 'lockers', () => {
      map.setPaintProperty('lockers', 'circle-color', '#f41cf1');
      canvas.style.cursor = '';
      mouseOverMarker = false;
    });
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
  } else {
    if (map.getLayer('start')) {
      map.removeLayer('start');
    }
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
  } else {
    if (map.getLayer('end')) {
      map.removeLayer('end');
    }
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
        map.addLayer(pathLayer);
      }
    }

    const bounds = pathGeoJSON.geometry.coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(pathGeoJSON.geometry.coordinates[0], pathGeoJSON.geometry.coordinates[0]));

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {padding: 80, offset: [0, -80]});
    }
  } else {
    if (map.getLayer('path')) {
      map.removeLayer('path');
    }
  }
}

export function latlngIsWithinBounds(latlng, type) {
  const isWithinBounds = latlng.lat <= config.boundsTop && latlng.lat >= config.boundsBottom && latlng.lng <= config.boundsRight && latlng.lng >= config.boundsLeft;
  if (!isWithinBounds) {
    let alertText = 'This tool only works for the San Francisco Bay Area.';
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
  return turf.length(path, {units: 'miles'});
}

export function updateMapSize() {
  if (!map) {
    return;
  }

  map.resize();
}

export function getCenter(point1, point2) {
  return {
    lat: (point1.lat + point2.lat) / 2,
    lng: (point1.lng + point2.lng) / 2
  }
}

export function toggleBikeLockerLayer(visible) {
  if (!map) {
    return;
  }

  if (visible) {
    if (!map.getLayer('lockers')) {
      map.addLayer(lockersLayer);
    }
  } else {
    map.removeLayer('lockers');
  }
}

export function toggleBtwdStationsLayer(visible) {
  if (visible) {
    if (!map.getLayer('btwdStations')) {
      map.addLayer(btwdStationsLayer);
    }
  } else {
    map.removeLayer('btwdStations');
  }
}
