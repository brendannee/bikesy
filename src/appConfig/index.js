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

// Development: point the app at another routing backend, such as a local one.
if (process.env.NEXT_PUBLIC_BIKESY_API_URL) {
  config.BIKESY_API_URL = process.env.NEXT_PUBLIC_BIKESY_API_URL;
}

export default config;
