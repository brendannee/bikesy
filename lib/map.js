const _ = require('lodash');
const config = require('../frontendconfig.json');
const error = require('./error');
const autoLink = require('auto-link');

import 'whatwg-fetch';

let map;
let startMarker;
let endMarker;
let path;
let initialCenter;
let bikeLockers;
let pathLayer;

const L = typeof window === 'undefined' ? null : require('mapbox.js');

// Setup mapbox
if (L) {
  L.mapbox.accessToken = config.mapboxAccessToken;
}

export function drawMap(center, zoom, minZoom, draggable, handleMapClick, handleMarkerDrag) {
  initialCenter = center;
  map = L.map('map', {
    center,
    zoom,
    attributionControl: false,
    minZoom,
  });

  pathLayer = L.featureGroup().addTo(map);

  L.tileLayer(`https://api.mapbox.com/styles/v1/bikesy/cisrx1j8h00022wqa7n21sddv/tiles/256/{z}/{x}/{y}?access_token=${config.mapboxAccessToken}`).addTo(map);

  startMarker = L.marker(center, {
    draggable,
    icon: L.mapbox.marker.icon({
      'marker-size': 'large',
      'marker-symbol': 's',
      'marker-color': '#19b566',
    }),
  });

  endMarker = L.marker(center, {
    draggable: draggable,
    icon: L.mapbox.marker.icon({
      'marker-size': 'large',
      'marker-symbol': 'e',
      'marker-color': '#cf3043',
    }),
  });

  path = L.polyline([center, center], {
    color: '#ff6712',
    opacity: 1,
    weight: 6,
    dashArray: '6, 12',
  });

  // Bike Lockers layer
  const datasetID = 'bikesy/cjdr13xe624z133qhr55la61v';
  fetch(`https://api.mapbox.com/datasets/v1/${datasetID}/features?access_token=${config.mapboxAccessToken}`)
  .then(response => response.json())
  .then(geojson => {
    // Only show bike lockers
    geojson.features = _.filter(geojson.features, feature => feature.properties.type === 'locker');
    geojson.features.forEach(feature => {
      feature.properties.description = `<strong>${feature.properties.quantity} Lockers</strong><br>${autoLink.link(feature.properties.description)}`;
      feature.properties['marker-size'] = 'small';
      feature.properties['marker-color'] = '#7519b5';
    });
    bikeLockers = L.mapbox.featureLayer(geojson);
  });

  map.on('click', (event) => {
    handleMapClick(event.latlng);
  });

  startMarker.on('dragend', (event) => {
    const marker = event.target;
    handleMarkerDrag(marker.getLatLng(), 'start');
  });

  endMarker.on('dragend', (event) => {
    const marker = event.target;
    handleMarkerDrag(marker.getLatLng(), 'end');
  });

  // Attribution and disclaimer
  L.control.attribution({
    position: 'bottomright',
  })
  .addAttribution('© <a href="https://www.mapbox.com/about/maps/"" target="_blank">Mapbox</a> | © <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | <a href="/terms" target="_blank">Terms</a>  | <a href="mailto:info@bikesy.com">Feedback</a>  | <a href="https://511contracosta.org" target="_blank">511 Contra Costa Home</a>')
  .addTo(map);
}

export function updateStartMarker(latlng) {
  if (latlng) {
    startMarker.setLatLng(latlng).addTo(pathLayer);
  } else {
    startMarker.removeFrom(pathLayer);
  }
}

export function updateEndMarker(latlng) {
  if (latlng) {
    endMarker.setLatLng(latlng).addTo(pathLayer);
  } else {
    endMarker.removeFrom(pathLayer);
  }
}

export function updatePath(decodedPath) {
  if (!decodedPath) {
    path.removeFrom(pathLayer);
    path.setLatLngs([initialCenter, initialCenter]);
  } else {
    path.setLatLngs(decodedPath).addTo(pathLayer);
    const bounds = path.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(path.getBounds(), { padding: [80, 80] });
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

export function getPathDistance(decodedPath) {
  // Returns distance in meters
  const polyline = L.polyline(decodedPath);

  let distance = 0;
  const length = polyline._latlngs.length;
  for (let i = 1; i < length; i++) {
    distance += polyline._latlngs[i].distanceTo(polyline._latlngs[i - 1]);
  }
  return distance;
}

export function updateMapSize() {
  map.invalidateSize();
}

export function getCenter(point1, point2) {
  return {
    lat: (point1.lat + point2.lat) / 2,
    lng: (point1.lng + point2.lng) / 2
  }
}

export function toggleBikeLockerLayer(visible) {
  if (visible) {
    bikeLockers.addTo(map).bringToBack();
    pathLayer.bringToFront();
  } else {
    bikeLockers.removeFrom(map);
  }
}
