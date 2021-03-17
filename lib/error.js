/* global alert */

export function handleError(error, silent) {
  console.error(error)

  if (!silent) {
    /* eslint-disable-next-line no-alert */
    alert('An error has occurred. Please try again later.')
  }
}
