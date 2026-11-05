import App from 'next/app'
import Head from 'next/head'
import Analytics from '../components/GoogleAnalytics'
import Script from 'next/script'
import { Provider } from 'react-redux'

import appConfig from '../appConfig'
import store from '../redux/store'

const { FAVICON_DIR, FAVICON_MASK_ICON_COLOR } = appConfig

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    return (
      <Provider store={store}>
        <Head>
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href={`${FAVICON_DIR}/apple-touch-icon.png`}
          />
          <link
            rel="icon"
            type="image/png"
            href={`${FAVICON_DIR}/favicon-32x32.png`}
            sizes="32x32"
          />
          <link
            rel="icon"
            type="image/png"
            href={`${FAVICON_DIR}/favicon-16x16.png`}
            sizes="16x16"
          />
          {FAVICON_MASK_ICON_COLOR && (
            <link
              rel="mask-icon"
              href={`${FAVICON_DIR}/safari-pinned-tab.svg`}
              color={FAVICON_MASK_ICON_COLOR}
            />
          )}
        </Head>
        <Script
          src="https://api.mapbox.com/mapbox-gl-js/v3.33.0/mapbox-gl.js"
          strategy="beforeInteractive"
        ></Script>
        <Component {...pageProps} />
        <Analytics />
      </Provider>
    )
  }
}

export default MyApp
