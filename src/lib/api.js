export function getRoute(startLocation, endLocation, scenario) {
  const url = `${process.env.NEXT_PUBLIC_BIKESY_API_URL}?lat1=${startLocation.lat}&lng1=${startLocation.lng}&lat2=${endLocation.lat}&lng2=${endLocation.lng}&scenario=${scenario}`;

  return fetch(url)
    .then((response) => response.json())
    .catch((error) => {
      console.log('[FETCH ERROR!]', error);
    });
}
