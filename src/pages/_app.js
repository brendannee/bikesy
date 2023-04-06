import App from 'next/app';
import Script from 'next/script';
import { Provider } from 'react-redux';

import store from '@redux/store';

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
      </Provider>
    );
  }
}

export default MyApp;
