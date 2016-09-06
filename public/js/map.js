const config = require('../../frontendconfig.json');
const error = require('./error');

import 'whatwg-fetch';

let map;
let startMarker;
let endMarker;
let path;
let initialCenter;

const L = require('mapbox.js');

// Setup mapbox
L.mapbox.accessToken = config.mapboxAccessToken;

exports.drawMap = (center, zoom, minZoom, draggable, handleMapClick, handleMarkerDrag) => {
  initialCenter = center;
  map = L.map('map', {
    center,
    zoom,
    attributionControl: false,
    minZoom,
  });

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
    opacity: 0.8,
    width: 5,
    dashArray: '6, 12',
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
  .addAttribution('© <a href="https://www.mapbox.com/about/maps/"" target="_blank">Mapbox</a> | © <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | <a href="/terms" target="_blank">Terms</a>')
  .addTo(map);
};

exports.updateStartMarker = (latlng) => {
  if (latlng) {
    startMarker.setLatLng(latlng).addTo(map);
  } else {
    map.removeLayer(startMarker);
  }
};

exports.updateEndMarker = (latlng) => {
  if (latlng) {
    endMarker.setLatLng(latlng).addTo(map);
  } else {
    map.removeLayer(endMarker);
  }
};

exports.updatePath = (decodedPath) => {
  if (!decodedPath) {
    map.removeLayer(path);
    path.setLatLngs([initialCenter, initialCenter]);
  } else {
    path.setLatLngs(decodedPath).addTo(map);
    map.fitBounds(path.getBounds(), { padding: [30, 30] });
  }
};

exports.latlngIsWithinBounds = (latlng, type) => {
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
};

exports.getPathDistance = (decodedPath) => {
  // Returns distance in meters
  const polyline = L.polyline(decodedPath);

  let distance = 0;
  const length = polyline._latlngs.length;
  for (let i = 1; i < length; i++) {
    distance += polyline._latlngs[i].distanceTo(polyline._latlngs[i - 1]);
  }
  return distance;
};

exports.updateMapSize = () => {
  map.invalidateSize();
};
