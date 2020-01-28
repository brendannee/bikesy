import fetch from 'isomorphic-unfetch'

const config = require('../frontendconfig.json');

export function geocode(address) {
  const geocodeApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  const requestUrl = `${geocodeApiUrl}?address=${encodeURIComponent(address)}&key=${config.googleMapsApiKey}`;
  return fetch(requestUrl)
  .then((response) => response.json())
  .then((json) => {
    if (json.status !== 'OK') {
      throw new Error('Error geocoding');
    }

    if (!json.results.length) {
      throw new Error('No geocoding results');
    }

    return json.results[0].geometry.location;
  });
}

export function reverseGeocode(latlng) {
  const geocodeApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  const requestUrl = `${geocodeApiUrl}?latlng=${latlng.lat},${latlng.lng}&key=${config.googleMapsApiKey}`;
  return fetch(requestUrl)
  .then((response) => response.json())
  .then((json) => {
    if (json.status !== 'OK') {
      return 'Unable to get address';
    }

    if (!json.results.length) {
      return 'Unknown Address';
    }

    return json.results[0].formatted_address;
  });
}
