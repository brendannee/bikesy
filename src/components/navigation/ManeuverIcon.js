import { maneuverIcon } from '../../lib/navigation/icons';

// The SVG uses currentColor, so the parent's CSS color sets its color.
const ManeuverIcon = ({ type, modifier, size }) => (
  <span
    className="maneuver-icon"
    dangerouslySetInnerHTML={{ __html: maneuverIcon(type, modifier, size) }}
  />
);

export default ManeuverIcon;
