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
        <Component {...pageProps} />
      </Provider>
    );
  }
}

export default MyApp;
