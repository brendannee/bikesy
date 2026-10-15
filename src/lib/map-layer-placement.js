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
