/* global window */

function setSearchParameter(key, value) {
  if (!window.history.pushState) {
    return
  }

  if (!key) {
    return
  }

  let url = new URL(window.location.href)
  const parameters = new window.URLSearchParams(window.location.search)
  if (value === undefined || value === null) {
    parameters.delete(key)
  } else {
    parameters.set(key, value)
  }

  url.search = parameters
  url = url.toString()
  window.history.replaceState({ url }, null, url)
}

export function updateUrlParameters(parameters) {
  for (const [key, value] of Object.entries(parameters)) {
    setSearchParameter(key, value)
  }
}
