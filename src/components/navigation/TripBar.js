import { useSelector } from 'react-redux';

// Bottom bar while riding: arrival time, time and distance left, the steps list, the
// ?sim=1 controls and End.
const TripBar = ({ onSteps, onEnd, onSimSpeed, onSimPause, onMissTurn }) => {
  const trip = useSelector((state) => state.navigation.trip);
  const sim = useSelector((state) => state.navigation.sim);

  return (
    <div className="nav-trip-bar">
      <div className="nav-trip">
        <div className="nav-trip-arrival">
          <strong>{trip?.arrival ?? '–'}</strong>
          <span>arrival</span>
        </div>
        <div>
          <strong>{trip?.timeLeft ?? '–'}</strong>
          <span>left</span>
        </div>
        <div>
          <strong>{trip?.distanceLeft ?? '–'}</strong>
          <span>to go</span>
        </div>
      </div>
      <div className="nav-actions">
        <button className="btn btn-light nav-pill" onClick={onSteps}>
          Steps
        </button>
        {sim && (
          <div className="nav-sim" aria-label="Simulated rider">
            <button onClick={() => onSimSpeed(-2)} aria-label="Slower">
              −
            </button>
            <span>{sim.speedKmh} km/h</span>
            <button onClick={() => onSimSpeed(2)} aria-label="Faster">
              +
            </button>
            <button onClick={onSimPause} aria-label={sim.paused ? 'Resume' : 'Pause'}>
              {sim.paused ? '▶' : '❚❚'}
            </button>
            <button className="nav-sim-miss" onClick={onMissTurn}>
              Miss turn
            </button>
          </div>
        )}
        <button className="btn btn-danger nav-pill nav-end" onClick={onEnd}>
          End
        </button>
      </div>
    </div>
  );
};

export default TripBar;
