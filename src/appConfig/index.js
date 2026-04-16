import defaults from './defaults';
import sf from './sf';
import tahoe from './tahoe';
import contracosta from './contracosta';

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
