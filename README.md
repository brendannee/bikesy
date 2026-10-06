# Bikesy

This is a web app for finding bike directions. It is available at https://bikesy.com.

It uses OpenStreetMap routes served by the Valhalla backend at [api.bikesy.com](https://api.bikesy.com).

It allows users to specify a start and end point to a route along with a hill tolerance (from avoiding hills to not weighting hills much at all). It allows users to choose between three different scenarios of bike facilities from mainly bike lanes and bike routes to a very direct route.

Routes are displayed using the mapbox API.

### Bikesy API

The browser requests `https://api.bikesy.com/route` directly. For example:

```sh
curl 'https://api.bikesy.com/route?lat1=37.77201&lng1=-122.45189&lat2=37.76131&lng2=-122.42157&scenario=5'
```

The existing frontend `/api/route` endpoint returns a **307 temporary redirect** to that URL, preserving all query parameters, including repeated keys and empty values. Next.js may normalize equivalent URL encoding (for example, `%20` to `+`). `/api.php` uses the same handler for older native clients; Next.js may first normalize a trailing slash. GET/HEAD redirects use `Cache-Control: no-store`; OPTIONS responds with CORS headers. Ordinary browser/native GET fetches follow the redirect and receive the backend JSON. No coordinates or scenario are rewritten, and the frontend performs no extra validation: an omitted/empty scenario uses the backend default `1`. The web controls still default to `5` and preserve all nine existing combinations.

Clients must inspect the JSON `error` field even on HTTP 200, which the backend uses for legacy validation/no-route failures. The web client surfaces these failures, cancels superseded requests, ignores stale results and clears loading after failures. Direct cross-origin requests omit credentials and require the backend's CORS permission.

The new data image covers the Bay Area. The regional configuration files remain available, but this migration does not add Tahoe graph coverage. Historical Tahoe server metadata is retained and is not used by the new redirect.

The native source available for review uses ordinary `fetch` against `/api.php/`. Redirect-following and JSON compatibility can be checked locally, but the published iOS/Android binaries still need a device smoke test after the frontend is deployed. These local changes do not update the live bikesy.com redirects until publication.

## Planner page warmup

On the planner's initial mount, the existing URL parser checks for a trip. If one
is present, the automatic route request warms the backend. Otherwise, the page
fires a nonblocking `GET /health` on the origin of `appConfig.BIKESY_API_URL`
(normally `https://api.bikesy.com/health`), with `cache: 'no-store'` and no credentials.
Failures are ignored. Trip detection uses the existing URL field-presence check;
it adds no separate coordinate or scenario validation.

There is no periodic keepalive, retry, timer, or shared lifecycle registry. The
check runs on each planner mount (development effect replay can repeat it). It
only runs in the browser and does not delay routing or change route cancellation.
Deploy the frontend for this behavior to take effect.

## Tests and production build

```sh
node --test src/lib/*.test.mjs
npx next build
```

Use a Next.js server deployment for the compatibility routes; a static export cannot provide request-dependent redirects. The repository's older `next lint`/`next export` scripts predate its installed Next.js 16 version; avoid treating those commands as successful validation.

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
