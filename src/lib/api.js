import appConfig from 'appConfig';

export function getRoute(startLocation, endLocation, scenario) {
  const url = `${appConfig.BIKESY_API_URL}?lat1=${startLocation.lat}&lng1=${startLocation.lng}&lat2=${endLocation.lat}&lng2=${endLocation.lng}&scenario=${scenario}`;
  return fetch(url).then((response) => response.json());
}
