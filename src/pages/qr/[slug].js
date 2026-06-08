import { useEffect } from 'react';
import { useRouter } from 'next/router';
import React from 'react';

import appConfig from '../../appConfig';
import { handleError } from '../../lib/error';
import { reverseGeocode } from '../../lib/geocode';
import { formatLatLngForUrl } from '../../lib/url';

function encode(string) {
  return encodeURIComponent(string).replace(/%20/g, '+');
}

const QR = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { slug } = router.query;

    // Map slug to lat-long using appConfig URL_LOCATIONS
    const coords = appConfig.URL_LOCATIONS && appConfig.URL_LOCATIONS[slug];
    if (coords == null) {
      router.replace('/');
      return;
    }

    const latlng = { lat: coords[0], lng: coords[1] };
    // Reverse geocode lat-long, then build the index hash and redirect
    const redirectWithStart = (address) => {
      const params = [address, formatLatLngForUrl(latlng)];
      const hash = params.map(encode).join('/');

      router.replace(`/#/${hash}`);
    };

    reverseGeocode(latlng)
      .then((address) => {
        if (!address) {
          handleError(new Error('Unable to get reverse geocoding result.'));
          router.replace('/');
          return;
        }
        redirectWithStart(address);
      })
      .catch((error) => {
        handleError(error);
        router.replace('/');
      });
  }, [router.isReady, router.query.slug]);

  return null;
};

export default QR;
