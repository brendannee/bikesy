const config = {
  WELCOME_MODAL_TITLE: 'Welcome to Bikesy',
  SHOULD_SHOW_WELCOME_MODAL: true,
  SEARCH_BOUNDS: {
    TOP: 38.0534,
    RIGHT: -121.637,
    BOTTOM: 37.3064,
    LEFT: -122.8,
    ALERT_TEXT: 'This tool only works for the San Francisco Bay Area.',
  },
  MAPBOX_STYLE_URL: 'mapbox://styles/bikesy/ckmec4z6h3ekg17lr1fas6kwx',
  INITIAL_CENTER_LAT: 37.7749,
  INITIAL_CENTER_LNG: -122.4194,
  PAGE_TITLE: 'San Francisco Bay Area Bike Mapper - Bikesy',
  MAP_LAYERS: [
    {
      type: 'static',
      label: 'Multi-use Path',
      description: 'paved, separated (off the street) bikeways',
      iconClassName: 'sf-class1',
    },
    {
      type: 'static',
      label: 'Bike Lane',
      description: 'dedicated on-street bikeways, marked by striping on pavement',
      iconClassName: 'sf-class2',
    },
    {
      type: 'static',
      label: 'Bike Route',
      description: 'on-street routes signed for bicyclists',
      iconClassName: 'sf-class3',
    },
  ],
};

export default config;
