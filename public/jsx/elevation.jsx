const React = require('react');
import PropTypes from 'prop-types';
const classNames = require('classnames');
const LineChart = require('react-d3-basic').LineChart;

const helper = require('../js/helper');

class Elevation extends React.Component {
  getYDomain(elevationProfile) {
    return elevationProfile.reduce((memo, item) => {
      return [Math.min(memo[0], item.elevation), Math.max(memo[1], item.elevation)];
    }, [Infinity, -Infinity]);
  }

  formatX(d) {
    return d.distance;
  }

  formatElevationProfile() {
    return this.props.elevationProfile.map((item) => {
      return {
        elevation: helper.metersToFeet(item[1]),
        distance: helper.metersToMiles(item[0]),
      };
    });
  }

  render() {
    if (!this.props.elevationProfile || !this.props.elevationProfile.length) {
      return <div />;
    }

    if (!this.props.elevationVisible) {
      return (
        <div
          className={classNames(
            'elevation-open-box',
            { hide: this.props.isMobile && this.props.mobileView !== 'map' }
          )}
          onClick={this.props.toggleElevationVisibility}
        >Elevation Profile</div>
      );
    }

    const elevationProfile = this.formatElevationProfile();

    return (
      <div
        className={classNames(
          'elevation',
          { hide: this.props.isMobile && this.props.mobileView !== 'map' }
        )}
      >
        <div
          className="close-box"
          onClick={this.props.toggleElevationVisibility}
        >&minus;</div>
        <LineChart
          margins={{
            left: 70,
            right: 30,
            top: 20,
            bottom: 50,
          }}
          data={elevationProfile}
          width={this.props.width}
          height={this.props.height - 5}
          chartSeries={[
            {
              field: 'elevation',
              color: '#0e51ff',
            },
          ]}
          x={this.formatX}
          xLabel="Distance (miles)"
          yLabel="Elevation (feet)"
          yDomain={this.getYDomain(elevationProfile)}
          yTickFormat={this.formatYTicks}
        />
      </div>
    );
  }
}

Elevation.propTypes = {
  elevationProfile: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number.isRequired,
  elevationVisible: PropTypes.bool,
  toggleElevationVisibility: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
  mobileView: PropTypes.string,
};

module.exports = Elevation;
