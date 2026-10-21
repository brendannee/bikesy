# Regional Configuration

Use the config files in this directory to configure the Bikesy App to work differently in different regions.

Developers should add their region of interest to the `NEXT_PUBLIC_REGION` variable in the `.env` file. Then, when various places around the codebase `import appConfig from 'appConfig'`, they will get a config object like the object defined in the `src/appConfig/default.js` file, with local options overridden in the regional file.

Line overlay entries in `MAP_LAYERS` can use `zoomScaledLineWidth` and `ROUND_LINE_LAYOUT` from `src/lib/map-layer-styles.js` so the config holds only values. A layer's `layerProperties` may also be an array of layer definitions, drawn bottom-first (e.g. a casing under a fill).
