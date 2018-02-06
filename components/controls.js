const React = require('react');
import PropTypes from 'prop-types';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faCircleNotch from '@fortawesome/fontawesome-free-solid/faCircleNotch'

const _ = require('lodash');
const classNames = require('classnames');

const config = require('../frontendconfig.json');

import {scenarioToComponents, componentsToScenario} from '../lib/scenarios';

class Controls extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      startAddress: '',
      endAddress: '',
      routeType: '3',
      hillReluctance: '1',
      errorFields: [],
    };

    this.processForm = (event) => {
      event.preventDefault();

      this.updateRoute();
    };

    this.handleStartAddressChange = (event) => {
      this.setState({ startAddress: event.target.value });
    };

    this.handleEndAddressChange = (event) => {
      this.setState({ endAddress: event.target.value });
    };

    this.handleRouteTypeChange = (event) => {
      this.setState({
        routeType: event.target.value,
      }, this.updateRoute);
    };

    this.handleHillReluctanceChange = (event) => {
      this.setState({
        hillReluctance: event.target.value,
      }, this.updateRoute);
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.startAddress && nextProps.startAddress !== this.state.startAddress) {
      this.setState({
        startAddress: nextProps.startAddress,
      });
    }

    if (nextProps.endAddress && nextProps.endAddress !== this.state.endAddress) {
      this.setState({
        endAddress: nextProps.endAddress,
      });
    }

    if (nextProps.scenario) {
      const components = scenarioToComponents(nextProps.scenario);
      this.setState({
        hillReluctance: components.hillReluctance,
        routeType: components.routeType,
      });
    }
  }

  updateRoute() {
    const errorFields = this.validateForm();

    if (errorFields.length) {
      this.setState({ errorFields });
      return false;
    }

    const scenario = componentsToScenario({
      routeType: this.state.routeType,
      hillReluctance: this.state.hillReluctance,
    });

    return this.props.updateRoute(this.state.startAddress, this.state.endAddress, scenario);
  }

  validateForm() {
    const errorFields = [];
    if (!this.state.startAddress) {
      errorFields.push('startAddress');
    }

    if (!this.state.endAddress) {
      errorFields.push('endAddress');
    }

    return errorFields;
  }

  render() {
    return (
      <div className="controls hidden-print" hidden={this.props.mobileView !== 'directions' && this.props.isMobile}>
        <form onSubmit={this.processForm}>
          <div className={classNames('form-group', 'form-inline', 'start-address', { 'has-error': _.includes(this.state.errorFields, 'startAddress') })}>
            <label className="control-label">Start Location</label>
            <img
              src="static/images/start_marker.png"
              srcSet="static/images/start_marker@2x.png 2x"
              className="control-icon"
              alt="Start Marker"
            />
            <input
              type="text"
              value={this.state.startAddress}
              onChange={this.handleStartAddressChange}
              className="form-control"
              placeholder={config.startAddressPlaceholder}
            />
          </div>
          <div
            className={classNames(
              'form-group',
              'form-inline',
              'end-address',
              { 'has-error': _.includes(this.state.errorFields, 'endAddress') }
            )}
          >
            <label className="control-label">End Location</label>
            <img
              src="static/images/end_marker.png"
              srcSet="static/images/end_marker@2x.png 2x"
              className="control-icon"
              alt="End Marker"
            />
            <input
              type="text"
              value={this.state.endAddress}
              onChange={this.handleEndAddressChange}
              className="form-control"
              placeholder={config.endAddressPlaceholder}
            />
          </div>
          <div className="form-group form-inline route-type">
            <label className="control-label">Route Type</label>
            <select
              className="form-control"
              onChange={this.handleRouteTypeChange}
              value={this.state.routeType}
            >
              <option value="1">Mostly bike paths & lanes</option>
              <option value="2">A reasonable route</option>
              <option value="3">A more direct route</option>
            </select>
          </div>
          <div className="form-group form-inline hill-reluctance">
            <label className="control-label">Hill Reluctance</label>
            <select
              className="form-control"
              onChange={this.handleHillReluctanceChange}
              value={this.state.hillReluctance}
            >
              <option value="1">Avoid at all costs</option>
              <option value="2">A reasonable route</option>
              <option value="3">Bring on the Hills!</option>
            </select>
          </div>
          <a href="#" className="clear-link" onClick={this.props.clearRoute}>Clear</a>
          <button
            type="submit"
            className="btn btn-success btn-update-route"
          >
            <FontAwesomeIcon icon={faCircleNotch} spin className={classNames({ 'icon-not-loading': !this.props.loading })}/> Get Directions
          </button>
        </form>
      </div>
    );
  }
}

Controls.propTypes = {
  updateRoute: PropTypes.func.isRequired,
  clearRoute: PropTypes.func.isRequired,
  startAddress: PropTypes.string,
  endAddress: PropTypes.string,
  loading: PropTypes.bool,
  isMobile: PropTypes.bool,
  mobileView: PropTypes.string.isRequired
};

export default Controls;
