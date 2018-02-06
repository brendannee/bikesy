function encode(string) {
  return encodeURIComponent(string).replace(/%20/g, '+');
}

function decode(string) {
  return decodeURIComponent(string.replace(/\+/g, '%20'));
}

export function validateUrlParams(params) {
  return params.length >= 2 && params[0] !== 'undefined' && params[1] !== 'undefined';
}

export function updateUrlParams(params) {
  if (!validateUrlParams(params)) {
    return;
  }

  window.location.hash = params.map(encode).join('/');
}

export function readUrlParams() {
  return window.location.hash.replace(/^#\/?|\/$/g, '').split('/').map(decode);
}

export function getUrl() {
  return window.location.href;
}
