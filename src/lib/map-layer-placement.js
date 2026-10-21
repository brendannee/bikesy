// Imported Standard labels are not part of getStyle().layers. Keep the route
// above the bike overlays, and below the unslotted endpoint pins, on every add.
export function addRouteLayer(map, layer) {
  const layers = map.getStyle().layers;
  const firstPin = layers.find((item) => item.id === 'start' || item.id === 'end');
  if (map.getSlots?.().includes('top')) {
    const bikes = layers.filter((item) => /^class[1-4]$/.test(item.id));
    // Unslotted layers render above all slots. A top-slot route would disappear
    // behind these overlays; follow their placement without changing the style.
    if (bikes.some((item) => !item.slot)) {
      map.addLayer({ ...layer }, firstPin?.id);
    } else {
      map.addLayer({ ...layer, slot: 'top' });
    }
  } else {
    const firstSymbol = layers.find((item) => item.type === 'symbol');
    map.addLayer({ ...layer }, firstSymbol?.id ?? firstPin?.id);
  }
}

// Line and fill overlays (bikeways) go under the basemap labels so street and place
// names stay readable, and under the route so it is never hidden by a toggled overlay.
// Point overlays (construction, parking, shops) stay on top where they can be clicked.
export function addOverlayLayer(map, layer) {
  if (layer.type === 'symbol' || layer.type === 'circle') {
    map.addLayer({ ...layer });
    return;
  }
  if (map.getSlots?.().includes('middle')) {
    map.addLayer({ ...layer, slot: 'middle' });
    return;
  }
  const layers = map.getStyle().layers;
  const before =
    layers.find((item) => item.id === 'path') ??
    layers.find((item) => item.type === 'symbol') ??
    layers.find((item) => item.id === 'start' || item.id === 'end');
  map.addLayer({ ...layer }, before?.id);
}

// Restyle layers that belong to the basemap style, e.g. to make the basemap's trail
// line defer to a bikeway overlay drawn on top of it.
export function applyBasemapLayerOverrides(map, overrides = {}) {
  for (const [id, { paint = {}, layout = {} }] of Object.entries(overrides)) {
    if (!map.getLayer(id)) {
      continue;
    }
    for (const [name, value] of Object.entries(paint)) {
      map.setPaintProperty(id, name, value);
    }
    for (const [name, value] of Object.entries(layout)) {
      map.setLayoutProperty(id, name, value);
    }
  }
}
