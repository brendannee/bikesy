import { useSelector } from 'react-redux';

import ManeuverIcon from './ManeuverIcon';

// Ride summary at the destination. Done goes back to planning.
const ArrivalCard = ({ onDone }) => {
  const summary = useSelector((state) => state.navigation.summary);

  if (!summary) {
    return null;
  }

  return (
    <div className="nav-arrival" role="dialog" aria-label="You've arrived">
      <div className="nav-arrival-flag">
        <ManeuverIcon type="arrive" size={34} />
      </div>
      <h2>You've arrived</h2>
      <div className="nav-arrival-stats">
        <div>
          <strong>{summary.distance}</strong>
          <span>ridden</span>
        </div>
        <div>
          <strong>{summary.time}</strong>
          <span>time</span>
        </div>
        <div>
          <strong>{summary.speed}</strong>
          <span>avg</span>
        </div>
      </div>
      {summary.note && <p className="nav-arrival-note">{summary.note}</p>}
      <button className="btn btn-success btn-block btn-lg" onClick={onDone}>
        Done
      </button>
    </div>
  );
};

export default ArrivalCard;
