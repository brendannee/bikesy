import { CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { useSelector } from 'react-redux';

import { formatElevation, formatGrade, metersToFeet, metersToMiles, calculateGrade } from 'lib/helper';

const CustomTooltip = ({ active, payload }) => {
  if (active) {
    return (
      <div className="custom-tooltip">
        <p className="label">{formatGrade(payload[0].payload.grade)} grade, {formatElevation(payload[0].value)}</p>
      </div>
    );
  }

  return null;
};

const Elevation = ({
  elevationVisible,
  isMobile,
  mobileView,
  toggleElevationVisibility,
  width,
  height,
}) => {
  const elevationProfile = useSelector((state) => state.search.elevationProfile);

  if (!elevationProfile || !elevationProfile.length) return null;

  if (!elevationVisible) {
    return (
      <div
        className="elevation-open-box"
        hidden={isMobile && mobileView !== 'map'}
        onClick={toggleElevationVisibility}
      >
        Elevation Profile
      </div>
    );
  }

  const chartData = elevationProfile.map((node, index) => {
    const previousNode = index < 5 ? elevationProfile[0] : elevationProfile[index - 5];
    const nextNode = index > elevationProfile.length - 6 ? elevationProfile[elevationProfile.length - 1] : elevationProfile[index + 5];

    return {
      elevation: metersToFeet(node.elevation),
      distance: metersToMiles(node.distance),
      grade: calculateGrade(previousNode, nextNode)
    };
  });

  return (
    <div className="elevation" hidden={isMobile && mobileView !== 'map'}>
      <div className="close-box d-print-none" onClick={toggleElevationVisibility}>
        &minus;
      </div>

      <LineChart
        width={width}
        height={height - 5}
        data={chartData}
        margin={{
          left: 15,
          right: 5,
          top: 15,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <Line type="monotone" dataKey="elevation" stroke="#0e51ff" dot={false} />
        <XAxis
          dataKey="distance"
          type="number"
          label={{
            value: 'Distance (miles)',
            offset: 0,
            position: 'insideBottom',
            scale: 'linear',
          }}
        />
        <YAxis
          type="number"
          label={{
            value: 'Elevation (feet)',
            angle: -90,
            position: 'insideBottomLeft',
            offset: 10,
            scale: 'linear',
          }}
        />
        <Tooltip content={<CustomTooltip />} />
      </LineChart>
    </div>
  );
};

export default Elevation;
