import App from 'next/app';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import { Provider } from 'react-redux';

import store from '../redux/store';

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <Provider store={store}>
        <Script
          src="https://api.mapbox.com/mapbox-gl-js/v2.8.2/mapbox-gl.js"
          strategy="beforeInteractive"
        ></Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
          `}
        </Script>
        <Component {...pageProps} />
        <Analytics
          beforeSend={(event) => {
            // Trip URLs contain addresses and coordinates; keep only the page path.
            const url = new URL(event.url);
            url.search = '';
            url.hash = '';
            return { ...event, url: url.toString() };
          }}
        />
      </Provider>
    );
  }
}

export default MyApp;
