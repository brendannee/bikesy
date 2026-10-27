import { useEffect, useState } from 'react';

// ?debug=1: heading and GPS readout, refreshed four times a second.
const DebugReadout = ({ getLines }) => {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setLines(getLines() ?? []), 250);
    return () => clearInterval(timer);
  }, [getLines]);

  return <pre className="nav-debug">{lines.join('\n')}</pre>;
};

export default DebugReadout;
