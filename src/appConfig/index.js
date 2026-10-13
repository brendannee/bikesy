import defaults from './defaults.js';
import sf from './sf.js';
import tahoe from './tahoe.js';
import contracosta from './contracosta.js';

const configs = {
  defaults,
  sf,
  tahoe,
  contracosta,
};

const DEFAULT_REGION = 'sf';
const region = process.env.NEXT_PUBLIC_REGION || DEFAULT_REGION;
const config = { ...configs.defaults, ...configs[region] };

export default config;
