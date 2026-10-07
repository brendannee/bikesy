# Bikesy

This is a web app for finding bike directions. It is available at https://bikesy.com.

It uses OpenStreetMap routes served by the Valhalla backend at [api.bikesy.com](https://api.bikesy.com).

It allows users to specify a start and end point to a route along with a hill tolerance (from avoiding hills to not weighting hills much at all). It allows users to choose between three different scenarios of bike facilities from mainly bike lanes and bike routes to a very direct route.

Routes are displayed using the mapbox API.

## Google Analytics 4

The frontend uses `GoogleAnalytics` and `sendGAEvent` from
`@next/third-parties/google`, matching Next.js 16.3.8. This replaces the old direct
Google scripts, unused Universal Analytics `react-ga` package, and Vercel Analytics.
The public measurement ID is **G-S9DP8E6902**, shared across regional builds unless
`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` overrides it. No secret is required for the client
Google tag. See [Next.js integration](https://nextjs.org/docs/pages/guides/third-party-libraries#google-analytics).

### Activation

Analytics is **off by default**. Before enabling it, the GA4 stream owner must turn
**Enhanced Measurement off** for this web data stream in Google Analytics Admin
→ Data streams → the web stream. This prevents automatic history, form, search,
and outbound-link events from collecting unsanitized inputs alongside our events.
This repository does not change or verify that dashboard setting.

Then set these public environment variables for the intended production build:

```dotenv
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-S9DP8E6902
NEXT_PUBLIC_GOOGLE_ANALYTICS_ENABLED=true
```

Only builds with `NODE_ENV=production`, an explicit `true` enable flag, and a valid
`G-` ID load the tag. Leave the flag unset or false for previews and local use.
Public variables are embedded at build time, so changing them requires rebuilding
and deploying. No deployment or live analytics delivery has been verified here.

The enable flag is an operator acknowledgement of the stream prerequisite, not an
API check. Setting it before Enhanced Measurement is off can reintroduce automatic
events. Google explicitly documents that `send_page_view: false` alone does not
disable history-based pageviews; see [manual pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views).

### Events and privacy

| Event | When | Custom properties |
| --- | --- | --- |
| `page_view` | Initial page and navigation to a different sanitized page | None |
| `route_submit` | Each Get Directions form submission, or an accepted pin drag-end with the other endpoint present | `source: form` or `pin_drag`, `scenario: 1`–`9` or `unknown` |
| `geolocation` | Use my location click, then its browser result | `outcome: requested`, `success`, `permission_denied`, `unavailable`, `timeout`, `unsupported`, or `error` |
| `route_clear` | Each Clear click | None |

Privacy defaults are queued before the Next.js component initializes the tag.
Initial automatic pageviews are disabled; the app sends one manual pageview per
sanitized page transition. Rerenders, effect replays, trip hashes and query changes
on the same page do not duplicate pageviews. Custom events run only in action
handlers. Form submissions measure intent, not successful routing. A pin drag emits
once at drag-end when the moved point is within bounds and the other endpoint is
present, using the current scenario. Movement, rejected drops, and drags without
a complete trip do not emit it. Routing from shared links, map clicks and scenario
changes alone is not counted.
Geolocation normally produces one request event and one result event.

Every manual event includes sanitized `page_location` and `page_referrer`, a fixed
`page_title: Bikesy`, and the intended `send_to` ID. Query strings and trip hashes
are removed, QR paths become `/qr`, other unrecognized paths become `/other`, and
incoming referrers retain only their origin. SPA pageview referrers use the previous
sanitized page. The actual trip links and routing state are untouched. The document
uses an origin-only HTTP referrer policy. No addresses, coordinates, search text,
polylines, QR identifiers, or raw errors are included in custom properties.

Blocked or failing analytics never interrupts routing, geolocation or clearing.
The Google tag can still generate standard lifecycle events (such as session start);
this integration does not claim that only our four named events exist. To report
`scenario`, `source`, or `outcome` as GA4 report dimensions, register the relevant
event-scoped custom dimensions in GA Admin. No remote settings are changed here.

Checks: `node --test src/lib/*.test.mjs` and `pnpm exec next build`. Browser checks
use a mocked Google tag and intercepted requests, not real collection traffic.

## Bicycle overlay tags

The [overlay generator](scripts/bicycle-overlays/README.md) infers display classes
from an OSM snapshot. These are **not official agency designations or safety
ratings**. The table describes the implemented rules (version 1.2.1), using the
default `--path-policy practical`. Classification does not change backend routing
costs or automatically update the hosted map style. All matches below must also
pass the access, lifecycle, surface and geometry filters described below.

| Inferred layer                                                   | OSM tags/values that contribute                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Class I — paths** (`class-I.geojson`)                          | `highway=cycleway`, or `highway=path/footway` with `bicycle=designated`, normally becomes a practical bicycle-path candidate without requiring `is_sidepath=no`. Explicit independence (`is_sidepath=no`) also supports I on cycleways or designated path/footway/track/bridleway/pedestrian ways. `bicycle=yes` alone is access evidence, not Class I evidence.              |
| **Class II — lanes** (`class-II.geojson`)                        | On road-centerline ways, `cycleway=lane` or `cycleway:left/right/both=lane`. Deprecated `opposite_lane` also matches, with a warning. `cycleway:*:lane=exclusive/advisory` is subtype metadata; advisory lanes remain II with lower confidence.                                                                                                                               |
| **Class III — shared lanes / bike routes** (`class-III.geojson`) | `cycleway=shared_lane` or `cycleway:left/right/both=shared_lane`. On eligible road types without an existing facility or separate-mapping/contraflow reference, `bicycle_road=yes` or `cyclestreet=yes` supplies a bicycle-priority-street fallback. Otherwise, `lcn/rcn/ncn/icn=yes` or active bicycle-route relation membership supplies a lower-confidence route fallback. |
| **Class IV — protected tracks** (`class-IV.geojson`)             | On road-centerline ways, `cycleway=track` or `cycleway:left/right/both=track`; deprecated `opposite_track` also matches with a warning. A separately mapped `highway=cycleway` is IV with `cycleway=track`, or with both `is_sidepath=yes` and `foot=no`, subject to the path precedence below.                                                                               |

For separately mapped paths, ordinary sidewalk classification takes precedence,
then explicit independence (`is_sidepath=no`), then protected-track evidence. Thus
a conflicting `highway=cycleway + is_sidepath=no + cycleway=track` currently matches
I. Practical path promotion excludes crossing, traffic-island, link and
separate-mapping contexts; see [the exact rules](scripts/bicycle-overlays/rules.mjs)
for the tag-specific checks. `--path-policy strict` disables the practical
promotion and requires independence evidence for I.

**`highway=cycleway` takes precedence over `footway=sidewalk`.** Such a way can
still appear as an inferred path, with sidewalk context retained. This does not
promote ordinary `highway=footway + footway=sidewalk` ways or override access
restrictions. A shared roadside cycleway (`is_sidepath=yes + foot=yes`) can be I in
practical mode; the class does not establish independence from roads.

### Sides, precedence and other tagging

- `cycleway:left/right` overrides `cycleway:both`, which overrides `cycleway`.
  Explicit `no`/`none` suppresses that side; `separate` records an independently
  mapped facility reference instead of drawing another facility on the road.
  Unsuffixed `cycleway=lane` alone does not invent two lanes.
- Example: `cycleway:both=lane + cycleway:left=track` yields II on the right and IV
  on the left. Adding `cycleway:right=no` removes the right-side match. A mixed
  way may therefore occur in multiple class files, once per file by OSM way ID.
- Left/right is relative to OSM way direction. Side-specific `:oneway` is honored;
  otherwise the generator uses road oneway and right-hand-traffic conventions.
  `oneway:bicycle=no` does not invent a contraflow lane. Plain `cycleway=opposite`
  is direction/access evidence only. Deprecated `opposite_*` values are warned
  and classified by their recognized suffix.
- `share_busway` is an **other facility**, not II or IV; `shared_busway` is accepted
  as a warned alias. Buffer metadata, `segregated=yes`, or `cycleway:*:separation`
  alone does **not** establish IV. A lane with physical-separation metadata stays
  II and is flagged for review; `segregated` concerns separation from pedestrians.
- `cycleway:lanes` / `bicycle:lanes` arrays and `cycleway:forward/backward` facility
  values are retained and warned, not parsed into facilities. Values such as
  `buffered_lane`, `shared` and `yes` are not direct class matches. Width,
  smoothness, lighting, speed, parking and crossing improvements are useful review
  evidence, not additional implemented class-selection rules.
- Relations with `route=bicycle` or `route_master=bicycle` retain network, reference,
  name and roles, including nested memberships. Inactive or conditional memberships
  cannot supply III fallback; mountain-bike-only relations are not used. Membership
  does not prove signage or grant access, and a reference such as `lcn_ref` alone
  does not trigger III. `route-network.geojson` is review metadata and can include
  restricted ways.

### Filters and three-layer compatibility exports

Access precedence is `bicycle` → `vehicle` → `access`, with directional tags taking
precedence within each mode. Effective `yes/designated/official`, unspecified
access and qualified `permissive` can be retained; `no/private/dismount/use_sidepath`
and limited or uncertain access are withheld in the affected direction. A feature
can remain if at least one relevant direction is eligible. Bicycle/access/vehicle,
oneway or cycleway `:conditional` tags are kept unevaluated and withhold the
facility; motorcar-only conditions do not. Inactive lifecycle tags, steps (even
with bicycle ramps), `area=yes`, motorway/motorway-link and `motorroad=yes` candidates
are withheld. Missing or degenerate geometry is not drawn.

The default `--surfaces all` includes paved, unpaved and unknown surfaces.
`--surfaces paved` keeps only recognized pavement: `paved`, `asphalt`, `concrete`,
`concrete:lanes`, `concrete:plates`, `paving_stones`, `sett`, `cobblestone` and
`unhewn_cobblestone`. Compacted/fine gravel remain unpaved; missing/unrecognized
surfaces are unknown. Side surface overrides both-side, then generic cycleway
surface, then the way surface. Buffer, separation and lane-subtype attributes
also use side → both → generic precedence. Review outputs retain filtered records.
For commands, all output files and review metadata, see the
[generator instructions](scripts/bicycle-overlays/README.md).

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
