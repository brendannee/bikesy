/* global window */

import ReactGA from 'react-ga'

const config = require('../frontendconfig.json')

export function logQuery() {}

export function ga() {
  ReactGA.initialize(config.googleAnalyticsId)
  ReactGA.pageview(window.location.pathname + window.location.search)
}
