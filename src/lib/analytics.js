import { sendGAEvent } from '@next/third-parties/google'

export const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ''
// Enable only after Enhanced Measurement has been disabled for this GA4 stream.
export const GA_ENABLED =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ENABLED === 'true' &&
  /^G-[A-Z0-9]+$/.test(GA_ID)

const STATIC_PATHS = new Set(['/', '/about', '/bikesy-api', '/privacy-policy'])
let initialized = false
let lastPageLocation

export function analyticsPageContext(href, referrer = '') {
  const url = new URL(href)
  const path = STATIC_PATHS.has(url.pathname)
    ? url.pathname
    : url.pathname.startsWith('/qr/')
      ? '/qr'
      : '/other'
  let safeReferrer = ''
  try {
    const ref = new URL(referrer)
    if (['https:', 'http:'].includes(ref.protocol))
      safeReferrer = ref.origin + '/'
  } catch {}
  return {
    page_location: url.origin + path,
    page_referrer: safeReferrer,
    page_title: 'Bikesy',
  }
}

export function initializeAnalytics() {
  if (!GA_ENABLED || typeof window === 'undefined') return false
  if (initialized) return true
  try {
    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      window.dataLayer.push(arguments)
    }
    // Queue privacy defaults BEFORE the Next.js component configures the tag.
    window.gtag('set', {
      ...analyticsPageContext(window.location.href, document.referrer),
      send_page_view: false,
    })
    initialized = true
    return true
  } catch {
    return false
  }
}

export function trackPageView() {
  if (!GA_ENABLED || !initialized) return
  try {
    const page = analyticsPageContext(window.location.href, document.referrer)
    if (page.page_location === lastPageLocation) return
    if (lastPageLocation) page.page_referrer = lastPageLocation
    sendGAEvent('set', page)
    sendGAEvent('event', 'page_view', { ...page, send_to: GA_ID })
    lastPageLocation = page.page_location
  } catch {}
}

// Event handlers supply bounded metadata only. Analytics never blocks an action.
export function trackEvent(name, properties = {}) {
  if (!GA_ENABLED || !initialized) return
  try {
    let data
    if (name === 'route_submit') {
      const scenario = String(properties.scenario)
      data = {
        source: properties.source === 'pin_drag' ? 'pin_drag' : 'form',
        scenario: /^[1-9]$/.test(scenario) ? scenario : 'unknown',
      }
    } else if (name === 'geolocation') {
      const outcomes = [
        'requested',
        'success',
        'permission_denied',
        'unavailable',
        'timeout',
        'unsupported',
        'error',
      ]
      data = {
        outcome: outcomes.includes(properties.outcome)
          ? properties.outcome
          : 'error',
      }
    } else if (name === 'route_clear') {
      data = {}
    } else {
      return
    }
    sendGAEvent('event', name, {
      ...data,
      ...analyticsPageContext(window.location.href, document.referrer),
      send_to: GA_ID,
    })
  } catch {}
}
