import { loadGoogleMapsLibrary } from './google-maps.js';

async function getGeocodingResults(request) {
  const { Geocoder } = await loadGoogleMapsLibrary('geocoding');
  const { results } = await new Geocoder().geocode({
    ...request,
    fulfillOnZeroResults: true,
  });
  return results;
}

export async function geocode(address) {
  const results = await getGeocodingResults({ address });
  if (!results.length) {
    throw new Error('No geocoding results');
  }

  // Redux and the routing API need plain coordinates, not a Google LatLng.
  const location = results[0].geometry.location;
  return { lat: location.lat(), lng: location.lng() };
}

export async function reverseGeocode(latlng) {
  try {
    const results = await getGeocodingResults({ location: latlng });
    if (!results.length) {
      return 'Unknown Address';
    }

    return results[0].formatted_address;
  } catch {
    // Map-click and geolocation callers expect an address string on failure.
    return 'Unable to get address';
  }
}
