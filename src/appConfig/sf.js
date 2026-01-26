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
  HILL_ROUTING_OPTIONS: [
    {
      text: 'Avoid at all costs',
      value: 1,
    },
    {
      text: 'A reasonable route',
      value: 2,
    },
    {
      text: 'Bring on the Hills!',
      value: 3,
    },
  ],
  ROUTE_TYPE_OPTIONS: [
    {
      text: 'Mostly bike paths & lanes',
      value: 1,
    },
    {
      text: 'A reasonable route',
      value: 2,
    },
    {
      text: 'A more direct route',
      value: 3,
    },
  ],
  DEFAULT_SCENARIO: '5',
  SCENARIOS: {
    1: {
      routeType: '3',
      hillReluctance: '1',
      server: 'http://ec2-54-196-193-14.compute-1.amazonaws.com',
    },
    2: {
      routeType: '3',
      hillReluctance: '2',
      server: 'http://ec2-54-196-193-14.compute-1.amazonaws.com',
    },
    3: {
      routeType: '3',
      hillReluctance: '3',
      server: 'http://ec2-54-196-193-14.compute-1.amazonaws.com',
    },
    4: {
      routeType: '2',
      hillReluctance: '1',
      server: 'http://ec2-100-26-222-3.compute-1.amazonaws.com',
    },
    5: {
      routeType: '2',
      hillReluctance: '2',
      server: 'http://ec2-100-26-222-3.compute-1.amazonaws.com',
    },
    6: {
      routeType: '2',
      hillReluctance: '3',
      server: 'http://ec2-100-26-222-3.compute-1.amazonaws.com',
    },
    7: {
      routeType: '1',
      hillReluctance: '1',
      server: 'http://ec2-54-157-131-188.compute-1.amazonaws.com',
    },
    8: {
      routeType: '1',
      hillReluctance: '2',
      server: 'http://ec2-54-157-131-188.compute-1.amazonaws.com',
    },
    9: {
      routeType: '1',
      hillReluctance: '3',
      server: 'http://ec2-54-157-131-188.compute-1.amazonaws.com',
    },
  },
};

export default config;
