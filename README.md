# Bikesy

This is a web app for finding bike directions. It is available at http://bikesy.com.

It uses routes based on open street maps and served from the [Bikesy Server](https://github.com/brendannee/bikesy-server).

It allows users to specify a start and end point to a route along with a hill tolerance (from avoiding hills to not weighting hills much at all). It allows users to choose between three different scenarios of bike facilities from mainly bike lanes and bike routes to a very direct route.

Routes are displayed using the mapbox API.


### Bikesy API

You can pull info directly from the bikesy backend using the [Bikesy API](https://blog.bikesy.com/api/: https://blog.bikesy.com/api/).

The assumptions that go into the routes provided by the Bikesy API are documented on the [Bikesy API page](https://blog.bikesy.com/api/) .


# Running Locally

To run locally:

    npm start

The open http://localhost:3000 in your browser.

# Compiling to static files

    gulp static

Files will be in the `public/dist` folder
