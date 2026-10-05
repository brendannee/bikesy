import appConfig from '../appConfig';
import { requestRoute } from './routing.js';

export function getRoute(startLocation, endLocation, scenario, { signal } = {}) {
  return requestRoute(startLocation, endLocation, scenario, {
    signal,
    url: appConfig.BIKESY_API_URL,
  });
}
