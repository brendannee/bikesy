import Head from 'next/head'
import NoSSR from 'react-no-ssr'

import App from '../components/app'

export default () => (
  <div>
    <Head>
      <title>San Francisco Bay Area Bike Mapper - Bikesy</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" key="viewport" />
      <meta name="description" content="Avoid hills and find bike routes with Bikesy.com, an innovative and open-source bike mapping system specially designed to find flat, safe, and fast bike routes anywhere in the San Francisco Bay Area. San Francisco isn’t New York – they might have taller buildings, but we’ve got bigger hills. Since we couldn’t find another service that lets you choose slightly longer but less steep routes, we made our own. Even better, Bikesy automatically gives you an elevation profile for your ride to help you prepare for the tough parts." />

      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.3/css/bootstrap.min.css" integrity="sha384-Zug+QiDoJOrZ5t4lssLdxGhVrurbmBWopoEl+M6BdEfwnCJZtKxi1KgxUyJq13dy" crossorigin="anonymous" />
      <link href='https://api.mapbox.com/mapbox.js/v3.1.1/mapbox.css' rel='stylesheet' />
      <link rel="stylesheet" type="text/css" href="static/css/style.css" />

      <link rel="apple-touch-icon" sizes="180x180" href="static/favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" href="static/favicon/favicon-32x32.png" sizes="32x32" />
      <link rel="icon" type="image/png" href="static/favicon/favicon-16x16.png" sizes="16x16" />
      <link rel="mask-icon" href="static/favicon/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="theme-color" content="#ffffff" />

      <script src="https://maps.google.com/maps/api/js?libraries=places"></script>
    </Head>

    <NoSSR>
      <App />
    </NoSSR>
  </div>
)
