import { useState, useEffect } from 'react';
import classNames from 'classnames';

import { getWeather } from 'lib/weather';
import { getAirQuality } from 'lib/airquality';

const Weather = ({ lat, lng }) => {
  const [weather, setWeather] = useState();
  const [airQuality, setAirQuality] = useState();

  const updateWeather = async () => {
    if (!lat || !lng) {
      return;
    }

    try {
      const weatherResults = await getWeather(lat, lng);

      if (weatherResults) {
        setWeather({
          temperature: Math.round(weatherResults.main.temp * 10) / 10,
          humidity: weatherResults.main.humidity,
          description:
            weatherResults.weather && weatherResults.weather.length
              ? weatherResults.weather[0].main
              : '',
        });
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const airQualityResults = await getAirQuality(lat, lng);

      if (airQualityResults && airQualityResults.length) {
        setAirQuality({
          aqi: airQualityResults[0].AQI,
          categoryNumber: airQualityResults[0].Category.Number,
          categoryName: airQualityResults[0].Category.Name,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    updateWeather();
  }, [lat, lng]);

  if (!weather || !lat || !lng) {
    return null;
  }

  return (
    <div className="weather">
      <h3 className="d-none d-print-block">Current Weather</h3>
      <div className="temperature">{weather.temperature}&deg;F</div>
      <div className="weather-description">{weather.description}</div>
      <div className="humidity">Humidity: {weather.humidity}%</div>
      {airQuality && (
        <div className="air-quality" hidden={airQuality.aqi === undefined}>
          Air Quality:
          <div
            className={classNames(
              'air-quality-box',
              `air-quality-box-${airQuality.categoryNumber}`
            )}
          >
            {airQuality.aqi} {airQuality.categoryName}
          </div>
        </div>
      )}
    </div>
  );
};

export default Weather;
