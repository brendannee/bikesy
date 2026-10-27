# Bikesy

[Bikesy](https://bikesy.com) is a bike route planner that helps riders find directions
based on their hill tolerance and preference for bike lanes, bike routes, or a more
direct trip. Three hill settings and three bike-facility preferences provide nine
routing combinations.

Routes use **OpenStreetMap (OSM)** data and are calculated by the
[Valhalla backend](https://github.com/BlinkTagInc/bikesy-backend)
at [api.bikesy.com](https://api.bikesy.com). This repository contains the Next.js
frontend, with Mapbox maps and Google Places address search and geocoding.
The routing backend currently covers the San Francisco Bay Area.

## Bikesy API

The browser requests `https://api.bikesy.com/route` directly, passing the start and
end coordinates and a routing scenario (`1`–`9`; the web controls default to `5`):

```sh
curl 'https://api.bikesy.com/route?lat1=37.77201&lng1=-122.45189&lat2=37.76131&lng2=-122.42157&scenario=5'
```

Clients must inspect the JSON `error` field even on HTTP 200, which the backend uses
for validation and no-route failures. Direct browser requests require the backend's
CORS permission.

The frontend's `/api/route` and legacy `/api.php` endpoints return a **307 temporary
redirect** to the backend, preserving query parameters. An omitted or empty scenario
uses the backend default of `1`. These compatibility endpoints require a Next.js
server deployment.

## Setup

Use Node.js 24 and **pnpm 12.8.1**, the version pinned in `package.json`.

```sh
pnpm install
cp .env.example .env
```

If you already have a `.env` file, update it using `.env.example` as a reference.
Configure these values:

- `NEXT_PUBLIC_REGION`: use `sf` for the Bay Area. The `tahoe` configuration is
  retained, but the current routing backend does not include Tahoe coverage.
  See [regional configuration](src/appConfig/README.md) for other configurations.
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: Mapbox token for displaying maps.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps key for address search and geocoding.
  Enable Maps JavaScript API, Places API (New), and Geocoding API. Allow your deployed
  site and `http://localhost:3000/*` in the key's HTTP referrer restrictions, and
  include these APIs in its API restrictions.
- `OPEN_WEATHER_MAP_API_KEY` and `AIRNOW_API_KEY`: server-side keys for weather and
  air-quality data.

Leave analytics disabled for local development; see [Analytics](#analytics) below.

### Running locally

```sh
pnpm run dev
```

Open http://localhost:3000 in your browser.

### Production build

```sh
pnpm exec next build
PORT=3000 pnpm run start
```

The start script requires `PORT`. Deploy with a Next.js server to support the API
routes, including weather, air quality, and routing compatibility redirects.

### Tests and formatting

```sh
pnpm exec node --test src/lib/*.test.mjs
pnpm exec prettier --check README.md
```

`pnpm run prettier` formats the entire repository in place.

## Turn-by-turn navigation

Navigation is on in every region, for everyone: there is no region setting or URL
parameter to turn it on. Tapping Start ride loads the navigation
engine (Ferrostar) on demand, so visitors who never navigate don't download it.

Every region's backend must support `/route?nav=1`, which the frontend sends only for rides
and reroutes. Planning requests don't send it.

For development, add `?sim=1` to ride a simulated rider (`&warp=8&noise=6` speeds it up and
adds GPS noise) and `?debug=1` for a heading and GPS readout. Set
`NEXT_PUBLIC_BIKESY_API_URL` to point at a different backend.

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
`unhewn_cobblestone`, plus `wood`, `metal`, `metal_grid`, `bricks` and `chipseal`.
Hard decking stays visible without admitting gravel/dirt trails; no bridge or
short-length exception overrides surface or access rules. Compacted/fine gravel
remain unpaved; missing/unrecognized surfaces are unknown. Side surface overrides both-side, then generic cycleway
surface, then the way surface. Buffer, separation and lane-subtype attributes
also use side → both → generic precedence. Review outputs retain filtered records.
For commands, all output files and review metadata, see the
[generator instructions](scripts/bicycle-overlays/README.md).

## Weather and air quality cache

Weather and AQI responses are cached in browser memory for **five minutes after a
successful response**, separately for each exact latitude/longitude pair and API
endpoint. Concurrent requests for the same location share one pending request.
Network, HTTP and JSON errors are not cached; a later call can retry. Expired
entries are removed on the next lookup. Location changes clear the displayed data,
and late responses for a previous location or an unmounted view are ignored.
There is no polling timer or shared server cache. Provider URLs and payloads remain
unchanged; this browser cache does not replace server/API rate limits.

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

## Analytics

Google Analytics 4 is optional and disabled by default. To enable it in a production
build, first disable **Enhanced Measurement** in the GA4 web stream, then set
`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` (the example uses `G-S9DP8E6902`) and
`NEXT_PUBLIC_GOOGLE_ANALYTICS_ENABLED=true` in `.env` and rebuild.

The app tracks page views and basic routing interactions with sanitized URLs;
custom events exclude addresses, coordinates, and search text. Analytics failures
do not interrupt routing.
