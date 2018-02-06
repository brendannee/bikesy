import Head from 'next/head'
export default () => (
  <div>
    <Head>
      <title>511 Contra Costa Bike Mapper</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" key="viewport" />
      <meta name="description" content="Avoid hills and find bike routes with the 511 Contra Costa Bike Mapper, an innovative and open-source bike mapping system specially designed to find flat, safe, and fast bike routes anywhere in the San Francisco Bay Area. San Francisco isn’t New York – they might have taller buildings, but we’ve got bigger hills. Since we couldn’t find another service that lets you choose slightly longer but less steep routes, we made our own. Even better, Bikesy automatically gives you an elevation profile for your ride to help you prepare for the tough parts." />

      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous" />
      <link rel="stylesheet" type="text/css" href="static/css/style.css" />
    </Head>
    <div class="container">
      <div class="card mt-5">
        <div class="card-body">We offer no guarantee regarding roadway conditions or safety of the proposed routes. Use your best judgment when choosing a route. Obey all vehicle code provisions.</div>
      </div>
    </div>
  </div>
)
