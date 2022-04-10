const config = {
  WELCOME_MODAL_TITLE: 'Welcome to the Tahoe Bike Map',
  SHOULD_SHOW_WELCOME_MODAL: true,
  SEARCH_BOUNDS: {
    TOP: 39.368232,
    RIGHT: -119.659482,
    BOTTOM: 38.750276,
    LEFT: -122.8,
    ALERT_TEXT: 'This tool only works for the Lake Tahoe region.',
  },
  LOGO_FILENAME_ROOT: 'ltbc-logo',
  LOGO_CLASSNAME: 'logo ltbc-logo',
  MAPBOX_STYLE_URL: 'mapbox://styles/tahoebike/ck3cbc5z81vr71clhw1rfylmy',
  INITIAL_CENTER_LAT: 39.086855,
  INITIAL_CENTER_LNG: -120.033305,
  ABOUT_LINK_TITLE: 'About the Lake Tahoe Bicycle Coalition',
  ABOUT_LINK_URL: 'https://tahoebike.org',
  PAGE_TITLE: 'Tahoe Bike Map',
  MAP_LAYERS: [
    {
      type: 'mapbox-dataset',
      label: 'Construction',
      description: undefined,
      iconClassName: 'construction',
      iconURL: 'images/ltbc-logo.png', // Placeholder
      datasetId: 'tahoebike/ck3pdyl2g5fn42tpnfsh5pibh',
      isInitiallyChecked: true,
    },
    {
      type: 'mapbox-dataset',
      label: 'Bike Parking',
      description: undefined,
      iconClassName: 'bikeParking',
      iconURL: 'images/ltbc-logo.png', // Placeholder
      datasetId: 'tahoebike/ck3pdz0lj0ezu2injv641rf8z',
      isInitiallyChecked: false,
    },
    {
      type: 'mapbox-dataset',
      label: 'Bike Shops',
      description: undefined,
      iconClassName: 'bikeShops',
      iconURL: 'images/ltbc-logo.png', // Placeholder
      datasetId: 'tahoebike/ck3pdzfet26fm2ilhadvn614o',
      isInitiallyChecked: false,
    },
    {
      type: 'mapbox-dataset',
      label: 'Multi-use Path',
      description: 'paved, separated (off the street) bikeways',
      iconClassName: 'class1',
      isInitiallyChecked: true,
    },
    {
      type: 'mapbox-dataset',
      label: 'Bike Lane',
      description: 'dedicated on-street bikeways, marked by striping on pavement',
      iconClassName: 'class2',
      isInitiallyChecked: true,
    },
    {
      type: 'mapbox-dataset',
      label: 'Bike Route',
      description: 'on-street routes signed for bicyclists',
      iconClassName: 'class3',
      isInitiallyChecked: true,
    },
    {
      type: 'mapbox-dataset',
      label: 'Plowed Winter Path',
      description: 'Bike paths that may be plowed for winter access. Paths get plowed after streets.',
      iconClassName: 'winter',
      isInitiallyChecked: false,
    },
  ],
};
export default config;
