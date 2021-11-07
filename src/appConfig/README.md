# Regional Configuration

Use the config files in this directory to configure the Bikesy App to work differently in different regions.

Developers should add their region of interest to the `NEXT_PUBLIC_REGION` variable in the `.env` file. Then, when various places around the codebase `import appConfig from 'appConfig'`, they will get a config object like the object defined in the `src/appConfig/default.js` file, with local options overridden in the regional file.
