const React = require('react');
import PropTypes from 'prop-types';
const classNames = require('classnames');

import {getWeather} from '../lib/weather';
import {getAirQuality} from '../lib/airquality';

class Weather extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      location: {}
    };
  }

  updateWeather() {
    getWeather(this.state.location.lat, this.state.location.lng)
    .then(results => {
      if (results) {
        this.setState({
          temperature: results.main.temp,
          humidity: results.main.humidity,
          description: results.weather && results.weather.length ? results.weather[0].main : ''
        });
      }
    });

    getAirQuality(this.state.location.lat, this.state.location.lng)
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

  componentDidMount() {
    if (this.state.location && this.state.location.lat) {
      this.updateWeather();
    }
  }

  componentDidUpdate() {
    if (this.state.shouldUpdate === true) {
      this.updateWeather();
      this.setState({
        shouldUpdate: false
      })
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {

    if (!nextProps.location || !nextProps.location.lat) {
      return null;
    }

    if (nextProps.location.lat === prevState.location.lat && nextProps.location.lng === prevState.location.lng) {
      return null;
    }

    return {
      location: nextProps.location,
      shouldUpdate: true
    };
  }

  render() {
    if (!this.state.location.lat) {
      return <div />;
    }

    return (
      <div className="weather">
        <h3 className="d-none d-print-block">Current Weather</h3>
        <div className="temperature">{this.state.temperature}&deg;F</div>
        <div className="weather-description">{this.state.description}</div>
        <div className="humidity">Humidity: {this.state.humidity}%</div>
        <div
          className="air-quality"
          hidden={this.state.aqi === undefined}
        >Air Quality:
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
