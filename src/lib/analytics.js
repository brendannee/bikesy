/* global window */

import ReactGA from 'react-ga';

export function logQuery() {}

export function ga() {
  ReactGA.initialize(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID);
  ReactGA.pageview(window.location.pathname + window.location.search);
}
