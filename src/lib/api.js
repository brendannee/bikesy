import fetch from "isomorphic-unfetch";

import config from "config/frontendconfig";

export function getRoute(startLocation, endLocation, scenario) {
  const { apiUrl } = config;
  const url = `${apiUrl}?lat1=${startLocation.lat}&lng1=${startLocation.lng}&lat2=${endLocation.lat}&lng2=${endLocation.lng}&scenario=${scenario}`;
  return fetch(url).then((response) => response.json());
}
