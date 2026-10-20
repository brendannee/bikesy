import { useEffect, useState } from 'react';

import { speech } from '../../lib/navigation/device';

const CAPTION_MS = 5000;

// Shows each spoken prompt for a few seconds: useful with the sound off.
const SpokenCaption = () => {
  const [text, setText] = useState(null);

  useEffect(() => {
    let timer;
    const unsubscribe = speech.onSay((said) => {
      setText(said);
      clearTimeout(timer);
      timer = setTimeout(() => setText(null), CAPTION_MS);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return text ? <div className="nav-caption">{text}</div> : null;
};

export default SpokenCaption;
