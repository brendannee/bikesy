let mapsPromise;
const libraryPromises = new Map();

function loadGoogleMaps() {
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      if (window.google?.maps?.importLibrary) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      const callback = '__bikesyMapsReady';
      window[callback] = () => {
        delete window[callback];
        resolve();
      };
      script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        loading: 'async',
        v: 'weekly',
        callback,
      })}`;
      script.async = true;
      script.onerror = () => {
        delete window[callback];
        script.remove();
        reject(new Error('Unable to load Google Maps.'));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      mapsPromise = undefined;
      throw error;
    });
  }

  return mapsPromise;
}

export function loadGoogleMapsLibrary(name) {
  if (!libraryPromises.has(name)) {
    const promise = loadGoogleMaps()
      .then(() => window.google.maps.importLibrary(name))
      .catch((error) => {
        libraryPromises.delete(name);
        throw error;
      });
    libraryPromises.set(name, promise);
  }

  return libraryPromises.get(name);
}
