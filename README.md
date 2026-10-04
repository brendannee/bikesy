# Bikesy

This is a web app for finding bike directions. It is available at http://bikesy.com.

It uses routes based on open street maps and served from the [Bikesy Server](https://github.com/brendannee/bikesy-server).

It allows users to specify a start and end point to a route along with a hill tolerance (from avoiding hills to not weighting hills much at all). It allows users to choose between three different scenarios of bike facilities from mainly bike lanes and bike routes to a very direct route.

Routes are displayed using the mapbox API.

### Bikesy API

You can pull info directly from the bikesy backend using the [Bikesy API](https://blog.bikesy.com/api/).

The assumptions that go into the routes provided by the Bikesy API are documented on the [Bikesy API page](https://blog.bikesy.com/api/) .

## Setup

Create a `.env` file by copying `.env.example`.

    cp .env.example .env

Add values to your `.env` config file for all fields. Choose a region, currently `sf` for San Francisco or `tahoe` for Lake Tahoe. Or, make your own file in the `src/appConfig` folder to support a new region and specify that as NEXT_PUBLIC_REGION in your `.env` file.

The Google Maps key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) needs **Maps JavaScript API**, **Places API (New)**, and **Geocoding API** enabled. Allow the deployed site and localhost in the key's HTTP referrer restrictions, and include these APIs in its API restrictions.

Address autocomplete uses Google's `PlaceAutocompleteElement` with the region's search bounds and automatic autocomplete session handling. A selection fetches only `formattedAddress` and `location`, both Place Details Essentials fields. Do not add `displayName`, ratings, reviews, atmosphere fields, or a wildcard to the field list in `src/lib/places.js`; they are unnecessary for routing and can increase the billing tier.

Typed addresses without a selected suggestion and reverse geocoding for map clicks or geolocation use `google.maps.Geocoder`. Places and geocoding share one Maps JavaScript loader and the same website-restricted key; the browser does not call the Geocoding REST endpoint directly. Geocoding requests do not request extra computations or Places details.

Install dependencies:

    yarn install

## Running Locally

To run locally:

    yarn dev

Then open http://localhost:3000 in your browser.

## Compiling to static files

    yarn export

Files will be in the `/out` folder

## Lints

    yarn lint
    yarn prettier
