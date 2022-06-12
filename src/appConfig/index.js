import defaults from 'appConfig/defaults';
import sf from 'appConfig/sf';
import tahoe from 'appConfig/tahoe';
import contracosta from 'appConfig/contracosta';

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
