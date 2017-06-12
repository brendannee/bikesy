const React = require('react');
const _ = require('lodash');
const classNames = require('classnames');

const config = require('../../frontendconfig.json');

const Disclaimer = require('./disclaimer.jsx');

const scenarios = require('../js/scenarios');

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
    if (nextProps.startAddress !== this.state.startAddress) {
      this.setState({
        startAddress: nextProps.startAddress,
      });
    }

    if (nextProps.endAddress !== this.state.endAddress) {
      this.setState({
        endAddress: nextProps.endAddress,
      });
    }

    if (nextProps.scenario) {
      const components = scenarios.scenarioToComponents(nextProps.scenario);
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

    const scenario = scenarios.componentsToScenario({
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
      <div className={classNames('controls', 'hidden-print', { hide: this.props.mobileView !== 'directions' && this.props.isMobile })}>
        <form onSubmit={this.processForm}>
          <div className={classNames('form-group', 'form-inline', 'start-address', { 'has-error': _.includes(this.state.errorFields, 'startAddress') })}>
            <label className="control-label">Start Location</label>
            <img
              src="img/start_marker.png"
              srcSet="img/start_marker@2x.png 2x"
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
              src="img/end_marker.png"
              srcSet="img/end_marker@2x.png 2x"
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
          {/* }<div className="form-group form-inline route-type">
            <label className="control-label">Route Type</label>
            <select
              className="form-control"
              onChange={this.handleRouteTypeChange}
              value={this.state.routeType}
            >
              <option value="1" disabled>Mostly bike paths & lanes</option>
              <option value="2" disabled>A reasonable route</option>
              <option value="3">A more direct route</option>
            </select>
          </div> */}
          <input type="hidden" value="3" />
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
            <i
              className={classNames(
                'fa',
                'fa-circle-o-notch',
                'fa-spin',
                { hidden: !this.props.loading }
              )}
              aria-hidden="true"
            ></i> Get Directions
          </button>
        </form>
        <Disclaimer classes={{ hide: !this.props.showDisclaimer }} />
      </div>
    );
  }
}

Controls.propTypes = {
  updateRoute: React.PropTypes.func.isRequired,
  clearRoute: React.PropTypes.func.isRequired,
  startAddress: React.PropTypes.string,
  endAddress: React.PropTypes.string,
  loading: React.PropTypes.bool,
  isMobile: React.PropTypes.bool.isRequired,
  mobileView: React.PropTypes.string.isRequired,
  showDisclaimer: React.PropTypes.bool.isRequired,
};

module.exports = Controls;
