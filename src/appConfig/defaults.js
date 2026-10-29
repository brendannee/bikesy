import { BIKESY_ROUTE_URL } from '../lib/routing.js';

const config = {
  // Likely common for most regions:
  BIKESY_API_URL: BIKESY_ROUTE_URL,
  INITIAL_ZOOM: 11,
  MIN_ZOOM: 9,
  BIKESY_LOW_BIKE_SPEED_MPH: 7.5,
  BIKESY_HIGH_BIKE_SPEED_MPH: 10,
  LOGO_FILENAME_ROOT: 'bikesy-logo',
  LOGO_CLASSNAME: 'logo',
  // Directory in public/ with favicon-16x16.png, favicon-32x32.png and apple-touch-icon.png.
  // When FAVICON_MASK_ICON_COLOR is set, it also has safari-pinned-tab.svg.
  FAVICON_DIR: '/favicon',
  FAVICON_MASK_ICON_COLOR: '#5bbad5',
  ELEVATION_CHART_Y_DOMAIN: [0, 'auto'],

  // Expected to be overridden for all regions:
  // TODO consider putting placeholders here to force regional overrides
  MAPBOX_STYLE_URL: 'mapbox://styles/bikesy/ckmec4z6h3ekg17lr1fas6kwx',
  INITIAL_CENTER_LAT: 37.7749,
  INITIAL_CENTER_LNG: -122.4194,
  // Route preference selects, see README.md. When null, they are built from
  // ROUTE_TYPE_OPTIONS and HILL_ROUTING_OPTIONS.
  ROUTING_CONTROLS: null,
  HILL_ROUTING_OPTIONS: [],
  ROUTE_TYPE_OPTIONS: [],
  DEFAULT_SCENARIO: '1',
  SCENARIOS: {},
  SEARCH_BOUNDS: {
    TOP: 38.0534,
    RIGHT: -121.637,
    BOTTOM: 37.3064,
    LEFT: -122.8,
    ALERT_TEXT: 'This tool only works for the San Francisco Bay Area.',
  },
  BICYCLE_OVERLAY_OPTIONS: {},
  SHOULD_SHOW_WELCOME_MODAL: true,
  START_LOCATION_ZOOM: 13,
  WELCOME_MODAL_TITLE: 'Welcome to Bikesy',
  ABOUT_LINK_TITLE: 'About Bikesy',
  ABOUT_LINK_URL: 'https://bikesy.com/about',
  PAGE_TITLE: 'Bikesy',
  MAP_LAYERS: [],
  URL_LOCATIONS: {},
};

export default config;
