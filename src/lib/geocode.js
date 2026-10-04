export function geocode(address) {
  const requestUrl = `/api/geocode?address=${encodeURIComponent(address)}`;
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
  const requestUrl = `/api/geocode?latlng=${latlng.lat},${latlng.lng}`;
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
