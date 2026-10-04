import { useEffect, useRef, useState } from 'react';

import appConfig from '../appConfig';
import { bindPlaceAutocomplete, loadPlacesLibrary } from '../lib/places';

const PlacesAutocomplete = ({
  id,
  value,
  placeholder,
  className,
  onChange,
  onPlaceSelected,
  onPendingChange,
}) => {
  const hostRef = useRef(null);
  const widgetRef = useRef(null);
  const bindingRef = useRef(null);
  const propsRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  propsRef.current = { value, placeholder, onChange, onPlaceSelected, onPendingChange };

  useEffect(() => {
    let disposed = false;

    loadPlacesLibrary()
      .then(({ PlaceAutocompleteElement }) => {
        if (disposed) {
          return;
        }

        const widget = new PlaceAutocompleteElement({
          value: propsRef.current.value,
          placeholder: propsRef.current.placeholder,
          locationRestriction: {
            north: appConfig.SEARCH_BOUNDS.TOP,
            east: appConfig.SEARCH_BOUNDS.RIGHT,
            south: appConfig.SEARCH_BOUNDS.BOTTOM,
            west: appConfig.SEARCH_BOUNDS.LEFT,
          },
          noInputIcon: true,
        });
        widget.id = id;
        widget.setAttribute(
          'aria-label',
          id === 'start-address' ? 'Start Location' : 'End Location',
        );
        bindingRef.current = bindPlaceAutocomplete(widget, {
          onChange: (text) => {
            setError('');
            propsRef.current.onChange(text);
          },
          onPlaceSelected: (place) => propsRef.current.onPlaceSelected(place),
          onPendingChange: (pending) => propsRef.current.onPendingChange(pending),
          onError: () =>
            setError('Suggestions unavailable. Enter an address for directions.'),
        });
        widgetRef.current = widget;
        hostRef.current.appendChild(widget);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) {
          setError('Suggestions unavailable. Enter an address for directions.');
        }
      });

    return () => {
      disposed = true;
      bindingRef.current?.dispose();
      widgetRef.current?.remove();
      widgetRef.current = null;
      bindingRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    bindingRef.current?.setValue(value);
  }, [value]);

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.placeholder = placeholder;
    }
  }, [placeholder]);

  return (
    <div className={`places-autocomplete ${className}`}>
      <div ref={hostRef} />
      {!ready && (
        <input
          id={id}
          type="text"
          className="form-control"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-label={id === 'start-address' ? 'Start Location' : 'End Location'}
        />
      )}
      {error && (
        <span className="sr-only" role="status">
          {error}
        </span>
      )}
    </div>
  );
};

export default PlacesAutocomplete;
