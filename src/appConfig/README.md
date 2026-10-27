# Regional Configuration

Use the config files in this directory to configure the Bikesy App to work differently in different regions.

Developers should add their region of interest to the `NEXT_PUBLIC_REGION` variable in the `.env` file. Then, when various places around the codebase `import appConfig from 'appConfig'`, they will get a config object like the object defined in the `src/appConfig/default.js` file, with local options overridden in the regional file.

Line overlay entries in `MAP_LAYERS` can use `zoomScaledLineWidth` and `ROUND_LINE_LAYOUT` from `src/lib/map-layer-styles.js` so the config holds only values. A layer's `layerProperties` may also be an array of layer definitions, drawn bottom-first (e.g. a casing under a fill).

## Route preference controls

The route preference selects under the address fields come from `ROUTING_CONTROLS`, a list of
controls. Each one is a select, rendered in order inside a `form-group` with a class derived
from its `key` (`routeType` becomes `route-type`, `hillReluctance` becomes `hill-reluctance`).
Set `className` on a control to override that class.

```js
ROUTING_CONTROLS: [
  {
    key: 'routeType',
    label: 'Route Type',
    options: [
      { text: 'Mostly bike paths & lanes', value: '1' },
      { text: 'A more direct route', value: '2' },
    ],
  },
  {
    key: 'surface',
    label: 'Surface',
    options: [
      { text: 'Paved & dirt OK', value: 'any' },
      { text: 'Prefer pavement', value: 'paved' },
    ],
  },
],
DEFAULT_SCENARIO: '1',
SCENARIOS: {
  1: { routeType: '1', surface: 'any' },
  2: { routeType: '1', surface: 'paved' },
  3: { routeType: '2', surface: 'any' },
  4: { routeType: '2', surface: 'paved' },
},
```

Each `SCENARIOS` entry has a value for every control `key`; the entry's id is what is stored in
the URL and sent to the routing API as `scenario`. Option values and scenario values are
compared as strings. A control with no options is not rendered.

If a combination of selections has no scenario (for example a sparse `SCENARIOS` table),
the scenario that matches the control the user just changed and the most other controls is
used; ties go to the first one in `SCENARIOS`. See `selectionsToScenario` in
`src/lib/scenarios.js`.

Regions without `ROUTING_CONTROLS` (San Francisco, Contra Costa) get a "Route Type" control
from `ROUTE_TYPE_OPTIONS` and a "Hill Reluctance" control from `HILL_ROUTING_OPTIONS`, with
`routeType` and `hillReluctance` values in `SCENARIOS`.
