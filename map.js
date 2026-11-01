(() => {
  'use strict';
  const mapElement = document.getElementById('salon-map');
  if (!mapElement) return;
  if (!window.L) {
    mapElement.innerHTML = '<p class="map-fallback">The map library could not load. Please check your internet connection, or use the OpenStreetMap address-search link below.</p>';
    return;
  }
  // Approximate Monument Road reference point near the supplied 229 Monument Road address.
  // This is NOT a verified building-level geocode; replace with the salon's exact GPS pin if available.
  const salonCoordinates = [-26.07733, 28.25375];
  const map = L.map(mapElement, { scrollWheelZoom: false }).setView(salonCoordinates, 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
  }).addTo(map);
  const marker = L.marker(salonCoordinates).addTo(map);
  marker.bindPopup(`<div class="map-popup-title">Sedi's Beauty Salon</div><div>229 Monument Road, Kempton Park</div><div><small>Approximate Monument Road reference point; verify exact entrance before travel.</small></div>`);
  marker.openPopup();
  window.setTimeout(() => map.invalidateSize(), 200);
})();
