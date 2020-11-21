/* global window */

function encode(string) {
  return encodeURIComponent(string).replace(/%20/g, '+')
}

function decode(string) {
  return decodeURIComponent(string.replace(/\+/g, '%20'))
}

export function validateUrlParameters(parameters) {
  return parameters.length >= 2 && parameters[0] !== undefined && parameters[1] !== undefined
}

export function updateUrlParameters(parameters) {
  if (!validateUrlParameters(parameters)) {
    window.location.hash = ''
    return
  }

  window.location.hash = parameters.map(p => encode(p)).join('/')
}

export function readUrlParameters() {
  return window.location.hash.replace(/^#\/?|\/$/g, '').split('/').map(p => decode(p))
}

export function getUrl() {
  return window.location.href
}
