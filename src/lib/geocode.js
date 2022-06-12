export function reverseGeocode(latlng) {
  const geocodeApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  const requestUrl = `${geocodeApiUrl}?latlng=${latlng.lat},${latlng.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
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
