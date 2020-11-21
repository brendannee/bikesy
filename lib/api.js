import fetch from 'isomorphic-unfetch'

const { apiUrl } = require('../frontendconfig.json')

export function getRoute(startLocation, endLocation, scenario) {
  const url = `${apiUrl}?lng1=${startLocation.lng}&lat1=${startLocation.lat}&lng2=${endLocation.lng}&lat2=${endLocation.lat}&scenario=${scenario}`
  return fetch(url)
    .then(response => response.json())
}
