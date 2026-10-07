import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { GoogleAnalytics } from '@next/third-parties/google'
import { analyticsPageContext } from './analytics.js'

// Register the real Next.js helper without running any scripts or network calls.
renderToString(createElement(GoogleAnalytics, { gaId: 'G-S9DP8E6902' }))
let revision = 0
async function setup(t, overrides = {}) {
  const env = {
    NODE_ENV: 'production',
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: 'G-S9DP8E6902',
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ENABLED: 'true',
    ...overrides,
  }
  const previous = {}
  for (const [key, value] of Object.entries(env)) {
    previous[key] = process.env[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  globalThis.window = {
    location: {
      href: 'https://bikesy.com/?qr=123#Private/37,-122/Work/38,-123/5',
    },
  }
  globalThis.document = {
    referrer: 'https://referrer.example/private?address=Home#37,-122',
  }
  t.after(() => {
    delete globalThis.window
    delete globalThis.document
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })
  return import(`./analytics.js?test=${revision++}`)
}
const commands = () => window.dataLayer.map((args) => [...args])

test('page locations, QR paths and referrers exclude private input', () => {
  for (const [url, expected] of [
    ['https://bikesy.com/?query=Home#Private/37,-122', 'https://bikesy.com/'],
    ['https://bikesy.com/qr/123?lat=37#Home', 'https://bikesy.com/qr'],
    ['https://bikesy.com/private-address', 'https://bikesy.com/other'],
    ['https://bikesy.com/about?query=Home', 'https://bikesy.com/about'],
  ]) {
    assert.deepEqual(
      analyticsPageContext(
        url,
        'https://user:secret@example.com/path?address=Home#37',
      ),
      {
        page_location: expected,
        page_referrer: 'https://example.com/',
        page_title: 'Bikesy',
      },
    )
  }
  assert.equal(
    analyticsPageContext('https://bikesy.com/', 'invalid').page_referrer,
    '',
  )
})

for (const overrides of [
  { NEXT_PUBLIC_GOOGLE_ANALYTICS_ENABLED: undefined },
  { NEXT_PUBLIC_GOOGLE_ANALYTICS_ENABLED: 'false' },
  { NODE_ENV: 'development' },
  { NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: 'UA-5291794-1' },
]) {
  test(`analytics stays off with ${JSON.stringify(overrides)}`, async (t) => {
    const analytics = await setup(t, overrides)
    assert.equal(analytics.GA_ENABLED, false)
    assert.equal(analytics.initializeAnalytics(), false)
    analytics.trackPageView()
    analytics.trackEvent('route_submit', { scenario: 5 })
    assert.equal(window.dataLayer, undefined)
  })
}

test('privacy defaults precede tag config; pageviews deduplicate hash/query changes and remounts', async (t) => {
  const analytics = await setup(t)
  const href = window.location.href
  assert(analytics.initializeAnalytics())
  assert(analytics.initializeAnalytics())
  assert.equal(commands().length, 1)
  assert.deepEqual(commands()[0], [
    'set',
    {
      page_location: 'https://bikesy.com/',
      page_referrer: 'https://referrer.example/',
      page_title: 'Bikesy',
      send_page_view: false,
    },
  ])
  window.gtag('config', analytics.GA_ID) // The Next.js component's initialization.
  analytics.trackPageView()
  analytics.trackPageView()
  assert.equal(window.location.href, href)
  window.location.href = 'https://bikesy.com/?private=Other#Other/36,-121'
  analytics.trackPageView()
  window.location.href = 'https://bikesy.com/about?private=Other'
  analytics.trackPageView()
  const views = commands().filter(
    ([command, name]) => command === 'event' && name === 'page_view',
  )
  assert.equal(views.length, 2)
  assert.equal(views[1][2].page_referrer, 'https://bikesy.com/')
  assert(
    !JSON.stringify(commands()).match(
      /Private|Other|37,-122|qr=123|address=Home/,
    ),
  )
})

test('custom events contain bounded metadata and sanitized context through the real SDK', async (t) => {
  const analytics = await setup(t)
  analytics.initializeAnalytics()
  analytics.trackEvent('route_submit', { scenario: 5, address: 'Private' })
  analytics.trackEvent('route_submit', { scenario: '37,-122' })
  analytics.trackEvent('route_submit', { scenario: 9, source: 'pin_drag', coordinates: [37, -122] })
  analytics.trackEvent('route_submit', { scenario: 5, source: 'Private' })
  analytics.trackEvent('geolocation', {
    outcome: 'permission_denied',
    error: 'Private',
  })
  analytics.trackEvent('geolocation', { outcome: 'Private' })
  analytics.trackEvent('route_clear', { coordinates: [37, -122] })
  analytics.trackEvent('Private', {})
  const events = commands().filter(([command]) => command === 'event')
  assert.deepEqual(
    events.map(
      ([
        ,
        name,
        { page_location, page_referrer, page_title, send_to, ...data },
      ]) => ({
        name,
        data,
      }),
    ),
    [
      { name: 'route_submit', data: { source: 'form', scenario: '5' } },
      { name: 'route_submit', data: { source: 'form', scenario: 'unknown' } },
      { name: 'route_submit', data: { source: 'pin_drag', scenario: '9' } },
      { name: 'route_submit', data: { source: 'form', scenario: '5' } },
      { name: 'geolocation', data: { outcome: 'permission_denied' } },
      { name: 'geolocation', data: { outcome: 'error' } },
      { name: 'route_clear', data: {} },
    ],
  )
  assert(
    events.every(
      ([, , data]) =>
        data.send_to === 'G-S9DP8E6902' &&
        data.page_location === 'https://bikesy.com/' &&
        data.page_referrer === 'https://referrer.example/',
    ),
  )
  assert(!JSON.stringify(commands()).match(/Private|37,-122|address=Home/))
})

test('throwing or blocked analytics cannot interrupt actions', async (t) => {
  const analytics = await setup(t)
  window.dataLayer = {
    push() {
      throw Error('blocked')
    },
  }
  assert.equal(analytics.initializeAnalytics(), false)
  window.dataLayer = []
  assert(analytics.initializeAnalytics())
  window.dataLayer.push = () => {
    throw Error('blocked')
  }
  assert.doesNotThrow(() => analytics.trackPageView())
  for (const name of ['route_submit', 'geolocation', 'route_clear']) {
    assert.doesNotThrow(() => analytics.trackEvent(name))
  }
})
