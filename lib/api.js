import fetch from 'isomorphic-unfetch'

const error = require('./error');

const { apiUrl } = require('../frontendconfig.json');

export function getRoute(startLocation, endLocation, scenario) {
  const url = `${apiUrl}?lat1=${startLocation.lat}&lng1=${startLocation.lng}&lat2=${endLocation.lat}&lng2=${endLocation.lng}&scenario=${scenario}`;
  return fetch(url)
  .then(response => response.json());
}
