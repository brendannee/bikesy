import 'whatwg-fetch';

const error = require('./error');

const config = require('../frontendconfig.json');

export function getRoute(startLocation, endLocation, scenario) {
  const url = `https://bikesy.com/api.php?lat1=${startLocation.lat}&lng1=${startLocation.lng}&lat2=${endLocation.lat}&lng2=${endLocation.lng}&scenario=${scenario}`;
  return fetch(url)
  .then(response => response.json());
}
