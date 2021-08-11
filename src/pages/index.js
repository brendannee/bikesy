import Head from 'next/head';

import App from 'components/app';

const Index = () => (
  <div>
    <Head>
      <title>511 Contra Costa Bike Mapper</title>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        key="viewport"
      />
      <meta
        name="description"
        content="Avoid hills and find bike routes with the 511 Contra Costa Bike Mapper, an innovative and open-source bike mapping system specially designed to find flat, safe, and fast bike routes in Contra Costa County and anywhere in the San Francisco Bay Area."
      />

      <link
        rel="stylesheet"
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
        integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh"
        crossOrigin="anonymous"
      />
      <link
        href="https://api.mapbox.com/mapbox-gl-js/v1.10.1/mapbox-gl.css"
        rel="stylesheet"
      />
      <link rel="stylesheet" type="text/css" href="css/style.css" />

      <link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" href="favicon/favicon-32x32.png" sizes="32x32" />
      <link rel="icon" type="image/png" href="favicon/favicon-16x16.png" sizes="16x16" />
      <link rel="mask-icon" href="favicon/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="theme-color" content="#ffffff" />

      <script src="https://api.mapbox.com/mapbox-gl-js/v1.10.1/mapbox-gl.js"></script>
    </Head>

    <App />
  </div>
);

export default Index;
