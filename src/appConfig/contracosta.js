import sfConfig from './sf';

const config = {
  WELCOME_MODAL_TITLE: 'Welcome to Bike Mapper',
  ABOUT_LINK_TITLE: 'About Bike Mapper',
  ABOUT_LINK_URL: 'https://511contracosta.org/biking/bike-mapper-faq/',
  SHOULD_SHOW_WELCOME_MODAL: true,
  SEARCH_BOUNDS: {
    TOP: 38.0534,
    RIGHT: -121.637,
    BOTTOM: 37.3064,
    LEFT: -122.8,
    ALERT_TEXT: 'This tool only works for the San Francisco Bay Area.',
  },
  MAPBOX_STYLE_URL: 'mapbox://styles/bikesy/ckmec4z6h3ekg17lr1fas6kwx',
  INITIAL_CENTER_LAT: 37.880002,
  INITIAL_CENTER_LNG: -122.094,
  PAGE_TITLE: '511 Contra Costa Bike Mapper',
  MAP_LAYERS: [
    {
      type: 'mapbox-dataset',
      label: 'Bike Lockers',
      description: undefined,
      iconClassName: 'contracosta-lockers',
      layerProperties: {
        type: 'circle',
        paint: {
          'circle-radius': 8,
          'circle-color': '#f41cf1',
          'circle-stroke-color': '#530a52',
          'circle-stroke-width': 1,
        },
      },
      datasetId: 'bikesy/cjdr13xe624z133qhr55la61v',
      isInitiallyChecked: false,
      popup: (feature) =>
        `<div style="font-size: 0.7rem;"><b>${feature.properties.Name}</b><br><b>${feature.properties.quantity} Lockers</b><br>${feature.properties.description}</div>`,
    },
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
  LOGO_FILENAME_ROOT: 'bikemapper-logo',
  LOGO_CLASSNAME: 'logo contracosta-logo',
  HILL_ROUTING_OPTIONS: sfConfig.HILL_ROUTING_OPTIONS,
  ROUTE_TYPE_OPTIONS: sfConfig.ROUTE_TYPE_OPTIONS,
};

export default config;
