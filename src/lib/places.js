let placesLibraryPromise;

export function loadPlacesLibrary() {
  if (!placesLibraryPromise) {
    placesLibraryPromise = new Promise((resolve, reject) => {
      if (window.google?.maps?.importLibrary) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      const callback = '__bikesyPlacesReady';
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
        reject(new Error('Unable to load Google Places.'));
      };
      document.head.appendChild(script);
    })
      .then(() => window.google.maps.importLibrary('places'))
      .catch((error) => {
        placesLibraryPromise = undefined;
        throw error;
      });
  }

  return placesLibraryPromise;
}

// Keep the widget's session token by using the prediction's Place instance.
export async function fetchRoutePlace(placePrediction) {
  const place = placePrediction.toPlace();
  // Essentials fields only. displayName, ratings, reviews and atmosphere data
  // increase the billing tier and are not needed to route a bicycle trip.
  await place.fetchFields({ fields: ['formattedAddress', 'location'] });

  if (!place.location) {
    throw new Error('This place has no routing location.');
  }

  return {
    // Preserve the suggestion's business name and address without fetching displayName.
    address: placePrediction.text?.toString().trim() || place.formattedAddress,
    coordinates: { lat: place.location.lat(), lng: place.location.lng() },
  };
}

export function bindPlaceAutocomplete(element, callbacks) {
  let request = 0;

  const cancel = () => {
    request += 1;
    callbacks.onPendingChange(false);
  };
  const onInput = () => {
    cancel();
    callbacks.onChange(element.value);
  };
  const onSelect = async ({ placePrediction }) => {
    const currentRequest = ++request;
    callbacks.onChange(element.value);
    callbacks.onPendingChange(true);
    try {
      const result = await fetchRoutePlace(placePrediction);
      if (currentRequest === request) {
        element.value = result.address;
        callbacks.onPlaceSelected(result);
      }
    } catch (error) {
      if (currentRequest === request) {
        callbacks.onError(error);
      }
    } finally {
      if (currentRequest === request) {
        callbacks.onPendingChange(false);
      }
    }
  };
  const onError = () => {
    cancel();
    callbacks.onError(new Error('Address suggestions are unavailable.'));
  };

  element.addEventListener('input', onInput);
  element.addEventListener('gmp-select', onSelect);
  element.addEventListener('gmp-error', onError);

  return {
    setValue(value) {
      if (element.value !== value) {
        cancel();
        element.value = value;
      }
    },
    dispose() {
      request += 1;
      element.removeEventListener('input', onInput);
      element.removeEventListener('gmp-select', onSelect);
      element.removeEventListener('gmp-error', onError);
    },
  };
}
