const config = {
  // Likely common for most regions:
  BIKESY_API_URL: '/api/route',
  INITIAL_ZOOM: 11,
  MIN_ZOOM: 9,
  BIKESY_LOW_BIKE_SPEED_MPH: 7.5,
  BIKESY_HIGH_BIKE_SPEED_MPH: 10,

  // Expected to be overridden for all regions:
  // TODO consider putting placeholders here to force regional overrides
  MAPBOX_STYLE_URL: 'mapbox://styles/bikesy/ckmec4z6h3ekg17lr1fas6kwx',
  INITIAL_CENTER_LAT: 37.7749,
  INITIAL_CENTER_LNG: -122.4194,
  SEARCH_BOUNDS: {
    TOP: 38.0534,
    RIGHT: -121.637,
    BOTTOM: 37.3064,
    LEFT: -122.8,
    ALERT_TEXT: 'This tool only works for the San Francisco Bay Area.',
  },
  SHOULD_SHOW_WELCOME_MODAL: true,
  WELCOME_MODAL_TITLE: 'Welcome to Bikesy',
  ABOUT_LINK_TITLE: 'About Bikesy',
  ABOUT_LINK_URL: 'https://bikesy.com/about',
};

export default config
