/* global window */

function encode(string) {
  return encodeURIComponent(string).replace(/%20/g, '+');
}

function decode(string) {
  return decodeURIComponent(string.replace(/\+/g, '%20'));
}

export function validateUrlParams(parameters) {
  return (
    parameters.length >= 2 && parameters[0] !== undefined && parameters[1] !== undefined
  );
}

export function updateUrlParams(parameters) {
  if (!validateUrlParams(parameters)) {
    window.location.hash = '';
    return;
  }

  window.location.hash = parameters.map(encode).join('/');
}

export function readUrlParams() {
  return window.location.hash
    .replace(/^#\/?|\/$/g, '')
    .split('/')
    .map(decode);
}

export function getUrl() {
  return window.location.href;
}
