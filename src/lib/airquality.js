import fetch from "isomorphic-unfetch";

// Only fetch air quality info every 5 minutes
const cacheWindow = 5 * 60 * 60 * 1000;
let dataFetchTime;
let dataResults;

export const getAirQuality = async (lat, lng) => {
  const url = `/api/air-quality?lat=${lat}&lng=${lng}`;

  if (dataFetchTime && dataFetchTime + cacheWindow > Date.now()) {
    return dataResults;
  }

  dataFetchTime = Date.now();

  const response = await fetch(url);

  dataResults = response.json();

  return dataResults;
};
