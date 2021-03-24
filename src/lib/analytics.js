/* global window */

import ReactGA from "react-ga";

import config from "config/frontendconfig";

export function logQuery() {}

export function ga() {
  ReactGA.initialize(config.googleAnalyticsId);
  ReactGA.pageview(window.location.pathname + window.location.search);
}
