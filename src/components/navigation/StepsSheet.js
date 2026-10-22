import classNames from 'classnames';
import { useSelector } from 'react-redux';

import ManeuverIcon from './ManeuverIcon';

// The steps still ahead, opened from the trip bar.
const StepsSheet = ({ onClose }) => {
  const steps = useSelector((state) => state.navigation.steps);

  return (
    <div className="nav-steps">
      <div className="nav-steps-header">
        <strong>Upcoming</strong>
        <button className="close-box" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>
      <ol className="nav-steps-list">
        {steps.map((step, index) => (
          <li key={index}>
            <ManeuverIcon type={step.type} modifier={step.modifier} size={26} />
            <span className={classNames('nav-step-text', { unnamed: step.unnamed })}>
              {step.text}
            </span>
            <span className="nav-step-distance">{step.distance}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default StepsSheet;
