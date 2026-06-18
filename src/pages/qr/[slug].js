import { useEffect } from 'react';
import { useRouter } from 'next/router';
import React from 'react';

import appConfig from '../../appConfig';

const QR = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { slug } = router.query;

    router.replace(`/?qr=${slug}`);
  }, [router.isReady, router.query.slug]);

  return null;
};

export default QR;
