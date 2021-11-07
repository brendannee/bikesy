import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = process.env.NEXT_PUBLIC_BIKESY_API_URL;

// Define a service using a base URL and expected endpoints
export const searchApi = createApi({
  reducerPath: 'search',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  endpoints: (builder) => ({
    getRoute: builder.query({
      query: ({ start, end, scenario }) =>
        `${API_BASE}?lat1=${start[0]}&lng1=${start[1]}&lat2=${end[0]}&lng2=${end[1]}&scenario=${scenario}`,
    }),
  }),
});

export const { useGetRoute } = searchApi;

// export function getRoute(startLocation, endLocation, scenario) {
//   return fetch(url)
//     .then((response) => response.json())
//     .catch((error) => {
//       console.log('[FETCH ERROR!]', error);
//     });
// }

// import { getRoute } from 'api/route';

// export const fetchRoute = async () => {
//   try {
//     const results = await getRoute(startLocation, endLocation, scenario);

//     if (!results?.path?.length) {
//       throw new Error('No path received');
//       return;
//     }

//     const geoJSONPath = polyline.toGeoJSON(results.path[0]);
//     const elevation = results.elevation_profile.map((node) => ({
//       distance: node[0],
//       elevation: node[1],
//     }));

//     // logQuery(startAddress, endAddress, startLocation, endLocation);

//     return {
//       path: geoJSONPath,
//       distance: getPathDistance(geoJSONPath),
//       directions: results.directions,
//       elevation,
//     };
//   } catch (error) {
//     throw new Error(error);
//   }
// };
