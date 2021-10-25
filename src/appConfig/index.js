import defaults from 'appConfig/defaults';
import sf from 'appConfig/sf';
import tahoe from 'appConfig/tahoe';

const configs = {
  defaults,
  sf,
  tahoe,
}

const region = process.env.NEXT_PUBLIC_REGION;
const config = { ...configs.defaults, ...configs[region] };

export default config;
