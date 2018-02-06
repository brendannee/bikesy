import Head from 'next/head'
export default () => (
  <div>
    <Head>
      <title>San Francisco Bay Area Bike Mapper - Bikesy</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" key="viewport" />
      <meta name="description" content="Avoid hills and find bike routes with Bikesy.com, an innovative and open-source bike mapping system specially designed to find flat, safe, and fast bike routes anywhere in the San Francisco Bay Area. San Francisco isn’t New York – they might have taller buildings, but we’ve got bigger hills. Since we couldn’t find another service that lets you choose slightly longer but less steep routes, we made our own. Even better, Bikesy automatically gives you an elevation profile for your ride to help you prepare for the tough parts." />

      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous" />
      <link rel="stylesheet" type="text/css" href="static/css/style.css" />

      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      <link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="theme-color" content="#ffffff" />
    </Head>
    <div class="container">
      <div class="card mt-5">
        <div class="card-body">We offer no guarantee regarding roadway conditions or safety of the proposed routes. Use your best judgment when choosing a route. Obey all vehicle code provisions.</div>
      </div>
    </div>
  </div>
)
