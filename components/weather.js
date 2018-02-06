const React = require('react');
import PropTypes from 'prop-types';

import {getWeather} from '../lib/weather';

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
      </div>
    );
  }
}

Weather.propTypes = {
  location: PropTypes.object
};

export default Weather;
