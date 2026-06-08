const config = {
  // Round elevation chart Y-axis to nearest 1000 feet to make hills more visible.
  // Previously the range was 0 to max, which made hills imperceptible at high elevations.
  // Dynamic rounding (vs static values) handles multiple service areas at different elevations
  // (e.g., Carson City ~4,700 ft vs Tahoe ~6,200 ft vs Echo Summit ~7,400 ft).
  ELEVATION_CHART_Y_DOMAIN: [
    (dataMin) => Math.floor(dataMin / 1000) * 1000,
    (dataMax) => Math.ceil(dataMax / 1000) * 1000,
  ],
  HILL_ROUTING_OPTIONS: [],
  ROUTE_TYPE_OPTIONS: [
    {
      text: 'Mostly bike paths & lanes',
      value: 1,
    },
    {
      text: 'A more direct route',
      value: 2,
    },
  ],
  DEFAULT_SCENARIO: '1',
  SCENARIOS: {
    1: {
      routeType: '1',
      hillReluctance: null,
      server: 'http://ec2-52-35-131-66.us-west-2.compute.amazonaws.com',
    },
    2: {
      routeType: '2',
      hillReluctance: null,
      server: 'http://ec2-52-35-131-66.us-west-2.compute.amazonaws.com',
    },
  },
  WELCOME_MODAL_TITLE: 'Welcome to the Tahoe Bike Map',
  SHOULD_SHOW_WELCOME_MODAL: true,
  SEARCH_BOUNDS: {
    TOP: 39.368232,
    RIGHT: -119.659482,
    BOTTOM: 38.750276,
    LEFT: -120.399814,
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
      layerProperties: {
        type: 'symbol',
        layout: {
          'icon-image': 'images/construction_marker.png',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.15, 18, 0.2],
          'icon-allow-overlap': true,
        },
      },
      datasetId: 'tahoebike/ck3pdyl2g5fn42tpnfsh5pibh',
      isInitiallyChecked: true,
      popup: (feature) => {
        const disclaimer =
          'Construction notices provided by map users. Note that less recent notices may be out of date, and require confirmation.';
        return `
          <div class="popup-container">
            <p><b>${feature.properties.title}</b></p>
            <p>${feature.properties.description}</p>
            <small>
              ${
                feature.properties.last_updated
                  ? `Last Updated: ${feature.properties.last_updated}`
                  : ''
              }
              <br />
              ${disclaimer}
            </small>
          </div>
        `;
      },
    },
    {
      type: 'mapbox-dataset',
      label: 'Bike Parking',
      description: undefined,
      iconClassName: 'bikeParking',
      layerProperties: {
        type: 'symbol',
        layout: {
          'icon-image': 'images/BikeParkingIcon.png',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.15, 20, 0.35],
          'icon-allow-overlap': true,
        },
      },
      datasetId: 'tahoebike/ck3pdz0lj0ezu2injv641rf8z',
      isInitiallyChecked: false,
      popup: (feature) => `
        <div class="popup-container">
          <p><b>${feature.properties.description}</b></p>
          ${feature.properties.image ? `<div>${feature.properties.image}</div>` : ''}
        </div>
      `,
    },
    {
      type: 'mapbox-dataset',
      label: 'Bike Shops',
      description: undefined,
      iconClassName: 'bikeShops',
      layerProperties: {
        type: 'symbol',
        layout: {
          'icon-image': 'images/BikeShopIcon.png',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.15, 20, 0.35],
          'icon-allow-overlap': true,
        },
      },
      datasetId: 'tahoebike/ck3pdzfet26fm2ilhadvn614o',
      isInitiallyChecked: false,
      popup: (feature) => {
        let textContent = feature.properties.name
          ? `<b>${feature.properties.name}</b>`
          : 'Unknown Bike Shop';
        if (feature.properties.business_member) {
          textContent += '<br />LTBC Business Member';
        }
        if (feature.properties.address) {
          textContent += `<br />${feature.properties.address}`;
        }
        if (feature.properties.phone_number) {
          textContent += `<br />${feature.properties.phone_number}`;
        }
        if (feature.properties.website) {
          textContent += `<br /><a href="${feature.properties.website}" target="_blank">${feature.properties.website}</a>`;
        }

        return `<div class='popup-container'>${textContent}</div>`;
      },
    },
    {
      type: 'mapbox-dataset',
      label: 'Multi-use Path',
      description: 'paved, separated (off the street) bikeways',
      iconClassName: 'tahoe-class1',
      layerProperties: {
        type: 'line',
        paint: {
          'line-color': '#330066',
          'line-width': 1,
          'line-opacity': 0.8,
          'line-gap-width': 2,
        },
      },
      datasetId: 'tahoebike/cl1sw0vau1rmm28rs0zwud8el',
      isInitiallyChecked: true,
    },
    {
      type: 'mapbox-dataset',
      label: 'Bike Lane',
      description: 'dedicated on-street bikeways, marked by striping on pavement',
      iconClassName: 'tahoe-class2',
      layerProperties: {
        type: 'line',
        paint: {
          'line-color': '#660099',
          'line-width': 3,
          'line-opacity': 0.8,
        },
      },
      datasetId: 'tahoebike/cl1swsss40zax2emy7z7isg57',
      isInitiallyChecked: true,
    },
    {
      type: 'mapbox-dataset',
      label: 'Bike Route',
      description: 'on-street routes signed for bicyclists',
      iconClassName: 'tahoe-class3',
      layerProperties: {
        type: 'line',
        paint: {
          'line-color': '#9933CC',
          'line-width': 3,
          'line-opacity': 0.8,
          'line-dasharray': [3, 5],
        },
      },
      datasetId: 'tahoebike/cl1swuzh0265221qxzoua365u',
      isInitiallyChecked: true,
    },
    {
      type: 'mapbox-dataset',
      label: 'Plowed Winter Path',
      description:
        'Bike paths that may be plowed for winter access. Paths get plowed after streets.',
      iconClassName: 'tahoe-winter',
      layerProperties: {
        type: 'line',
        paint: {
          'line-color': '#ff0000',
          'line-width': 3,
          'line-opacity': 0.8,
          'line-dasharray': [3, 5],
        },
      },
      /*
      This dataset has been uploaded to Mapbox.
        - Includes TRPA and Truckee city data
        - Preprocessing included to only select winter plowed paths
          - TRPA:
            - Only include trails with WNT_MAINT == 'YES'
            - Exclude trails with "MAINT_JURS" == "EL DORADO COUNTY" because they stopped plowing.
          - Truckee
            - Only include trails with CLASS == "I", and MAINTBY == "Town of Truckee"
            - "The trails that we plow in the winter are only those Class I paved trails managed by the Town" - Sarah Kunnen, Engineering Technician, Town Of Truckee
            - Exclude routes with install dates in the future
      */
      datasetId: 'tahoebike/cmod6xwi31ykt1npixuglmko7',
      isInitiallyChecked: false,
    },
  ],
  // QR Code Mappings allows physical QR codes with short links like bikesy.com/qr/1
  // to redirect to the map with the start location pre-filled.
  URL_LOCATIONS: {
    1: [38.907098, -120.012998],
    2: [38.9072448, -120.0125762],
    3: [38.91300866, -120.0053242],
    4: [38.91562242, -120.0036781],
    5: [38.91576016, -120.003603],
    6: [38.91602103, -120.004755],
    7: [38.91609573, -120.0047304],
    8: [38.92180878, -120.0142359],
    9: [38.92174322, -120.0146833],
    10: [38.92299663, -120.0207243],
    11: [38.92294515, -120.0207195],
    12: [38.91975059, -119.9974281],
    13: [38.91999886, -119.9972649],
    14: [38.92458872, -119.9899877],
    15: [38.92483014, -119.9898288],
    16: [38.92593251, -119.9879793],
    17: [38.92606467, -119.9878899],
    18: [38.9189444, -119.9793755],
    19: [38.91854586, -119.978669],
    20: [38.927276, -119.9846968],
    21: [38.92761949, -119.9843811],
    22: [38.93069696, -119.9851547],
    23: [38.93163624, -119.9795578],
    24: [38.93374631, -119.9781299],
    25: [38.93462031, -119.9778688],
    26: [38.93177981, -119.9717865],
    27: [38.93219758, -119.9715555],
    28: [38.92629344, -119.9657695],
    29: [38.92643244, -119.9663096],
    30: [38.92596696, -119.9665544],
    31: [38.93014444, -119.9624553],
    32: [38.93047527, -119.9620202],
    33: [38.93772495, -119.9774298],
    34: [38.93807552, -119.9774329],
    35: [38.93418198, -119.9561754],
    36: [38.93441834, -119.9558177],
    37: [38.93853343, -119.9603411],
    38: [38.93842158, -119.9602009],
    39: [38.94407905, -119.9766717],
    40: [38.9443923, -119.976399],
    41: [38.94540197, -119.9732769],
    42: [38.94567733, -119.9724937],
    43: [38.94077313, -119.9567519],
    44: [38.94096089, -119.9568994],
    45: [38.94179376, -119.9578009],
    46: [38.94191217, -119.9576967],
    47: [38.9435134, -119.9541324],
    48: [38.94383203, -119.953756],
    49: [38.94846426, -119.9580205],
    50: [38.94892318, -119.9570763],
    51: [38.94669278, -119.9481655],
    52: [38.9466459, -119.947877],
    53: [38.95329297, -119.9473046],
    54: [38.95346384, -119.9470093],
    55: [38.95370714, -119.9459],
    56: [38.95467218, -119.9411358],
    57: [38.95494334, -119.9411434],
    58: [38.95709765, -119.9477989],
    59: [38.95743816, -119.9482567],
    60: [38.96105487, -119.9463186],
    61: [38.96127919, -119.9464569],
    62: [38.92324921, -119.9916929],
    63: [38.92343143, -119.9918392],
    64: [38.92179097, -119.9945372],
    65: [38.92124684, -119.9947793],
    66: [38.93426529, -119.9561606],
    67: [38.92603197, -119.9877875],
    68: [38.92707765, -119.9851557],
    69: [38.93084109, -119.9850909],
    70: [38.92492762, -119.9855545],
    71: [38.93003898, -119.9627085],
  },
};
export default config;
