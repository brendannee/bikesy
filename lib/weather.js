import fetch from 'isomorphic-unfetch'

const config = require('../frontendconfig.json')

// Only fetch weather info every 5 minutes
const cacheWindow = 5 * 60 * 60 * 1000
let weatherFetchTime
let weatherResults

export const getWeather = async (lat, lng) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${config.openWeatherMapApiKey}`

  if (weatherFetchTime && (weatherFetchTime + cacheWindow > Date.now())) {
    return weatherResults
  }

  weatherFetchTime = Date.now()

  const response = await fetch(url)

  weatherResults = response.json()

  return weatherResults
}
