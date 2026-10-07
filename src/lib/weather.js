import { createCachedJsonFetch } from './cached-json.js';

const fetchWeather = createCachedJsonFetch('Weather');

export const getWeather = (lat, lng) =>
  fetchWeather(`/api/weather?${new URLSearchParams({ lat, lng })}`);
