const React = require('react');
import PropTypes from 'prop-types';
const classNames = require('classnames');

import {getWeather} from '../lib/weather';
import {getAirQuality} from '../lib/airquality';

class Weather extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  updateWeather() {
    getWeather(this.props.location.lat, this.props.location.lng)
    .then(results => {
      if (results) {
        this.setState({
          temperature: results.main.temp,
          humidity: results.main.humidity,
          description: results.weather && results.weather.length ? results.weather[0].main : ''
        });
      }
    });

    getAirQuality(this.props.location.lat, this.props.location.lng)
    .then(results => {
      if (results && results.length) {
        try {
          this.setState({
            aqi: results[0].AQI,
            categoryNumber: results[0].Category.Number,
            categoryName: results[0].Category.Name
          });
        } catch (err) {
          console.error(err);
        }
      }
    });
  }

  componentWillMount() {
    this.updateWeather();
  }

  componentWillReceiveProps() {
    this.updateWeather();
  }

  render() {
    if (!this.props.location) {
      return <div />;
    }

    return (
      <div className="weather">
        <div className="temperature">{this.state.temperature}&deg;F</div>
        <div className="weather-description">{this.state.description}</div>
        <div className="humidity">Humidity: {this.state.humidity}%</div>
        <div className="air-quality">Air Quality:
          <div className={classNames('air-quality-box', `air-quality-box-${this.state.categoryNumber}`)}>{this.state.aqi} {this.state.categoryName}</div>
        </div>
      </div>
    );
  }
}

Weather.propTypes = {
  location: PropTypes.object
};

export default Weather;
