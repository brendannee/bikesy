import { createCachedJsonFetch } from './cached-json.js';

const fetchAirQuality = createCachedJsonFetch('Air quality');

export const getAirQuality = (lat, lng) =>
  fetchAirQuality(`/api/air-quality?${new URLSearchParams({ lat, lng })}`);
