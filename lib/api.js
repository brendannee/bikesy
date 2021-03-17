import fetch from 'isomorphic-unfetch'

const { apiUrl } = require('../frontendconfig.json')

export function getRoute(startLocation, endLocation, hills, safety) {
  const url = `${apiUrl}?lng1=${startLocation.lng}&lat1=${startLocation.lat}&lng2=${endLocation.lng}&lat2=${endLocation.lat}&hills=${hills}&safety=${safety}`
  return fetch(url)
    .then(response => response.json())
}
