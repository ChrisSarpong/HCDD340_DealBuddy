
// /js/map.js
(function () {
  // -------- CONFIG (use your keys) --------
  const GEOAPIFY_API_KEY = "6699cb284b6b4e99a3baeb3d4d6c8103";
  const ABSTRACT_API_KEY = "a5591e99f3e54e4986121126251cbced";

  // -------- GLOBAL SINGLETON (prevents "Map container is already initialized") --------
  window.DealBuddyMap = window.DealBuddyMap || {};
  const state = window.DealBuddyMap.state || (window.DealBuddyMap.state = {
    map: null,
    markersLayer: null,
    mapContainerId: 'map'
  });

  // -------- UTIL --------
  const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim();

  // -------- MAP --------
  function initMap(mapContainerId = 'map', centerLat = 40.7934, centerLon = -77.8600, zoom = 14) {
    state.mapContainerId = mapContainerId;

    // ensure container exists
    const container = document.getElementById(mapContainerId);
    if (!container) {
      console.error(`Map container #${mapContainerId} not found.`);
      return null;
    }

    // require Leaflet loaded
    if (!window.L) {
      console.error('Leaflet is not loaded. Include Leaflet CSS & JS before /js/map.js.');
      return null;
    }

    // if map already exists, just recenter and return
    if (state.map) {
      state.map.setView([centerLat, centerLon], zoom);
      return state.map;
    }

    // if a previous instance attached silently, allow re-init by clearing internals (edge case)
    if (container._leaflet_id) container._leaflet_id = null;

    state.map = L.map(mapContainerId).setView([centerLat, centerLon], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; https://www.openstreetmap.org/copyrightOpenStreetMap</a>'
    }).addTo(state.map);

    state.markersLayer = L.layerGroup().addTo(state.map);
    return state.map;
  }

  function clearMarkers() {
    if (state.markersLayer) state.markersLayer.clearLayers();
  }

  function plotBars(bars, localData = []) {
    if (!state.map || !state.markersLayer || !Array.isArray(bars)) return;
    clearMarkers();

    const bounds = [];
    bars.forEach(b => {
      const hasCoords = typeof b.lat === 'number' && typeof b.lon === 'number';
      if (!hasCoords) return;

      // enrich popup from local JSON by normalized name
      const key = normalize(b.name);
      const local = localData.find(item => normalize(item.name) === key);

      const imgHtml = local?.image
        ? `${local.image}`
        : '';

      const dealHtml = local?.deal ? `<div>${local.deal}</div>` : '';
      const distanceHtml = (typeof b.distance === 'number')
        ? `<div><strong>${Math.round(b.distance)} m away</strong></div>`
        : '';

      const popupHtml = `
        <div style="min-width:220px">
          <div style="font-weight:700;margin-bottom:4px;">${b.name || 'Unnamed'}</div>
          ${distanceHtml}
          <div>${b.address || ''}</div>
          ${imgHtml}
          ${dealHtml}
        </div>
      `;

      const marker = L.marker([b.lat, b.lon]).addTo(state.markersLayer);
      marker.bindPopup(popupHtml);
      marker.bindTooltip(b.name || 'Bar', { direction: 'top' });

      bounds.push([b.lat, b.lon]);
    });

    if (bounds.length) {
      state.map.fitBounds(bounds, { padding: [24, 24] });
    }
  }

  // -------- DATA SOURCES --------
  async function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          async () => {
            try {
              const res = await fetch(`https://ipgeolocation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}`);
              const data = await res.json();
              resolve({ lat: data.latitude, lon: data.longitude });
            } catch {
              reject('Could not determine location.');
            }
          }
        );
      } else {
        fetch(`https://ipgeolocation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}`)
          .then((res) => res.json())
          .then((data) => resolve({ lat: data.latitude, lon: data.longitude }))
          .catch((err) => reject(err));
      }
    });
  }

  async function fetchNearbyBars(lat, lon) {
    const radius = 2000; // 2 km
    const categories = "catering.bar";
    const limit = 20;

    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    return (data.features || []).map(f => ({
      name: f.properties.name,
      address: f.properties.address_line2 || f.properties.formatted,
      distance: f.properties.distance,
      lat: f.geometry.coordinates[1], // [lon, lat] -> lat
      lon: f.geometry.coordinates[0], // [lon, lat] -> lon
    }));
  }

  function loadLocalBars(scriptId = 'bars') {
    const el = document.getElementById(scriptId);
    if (!el) return [];
    try {
      const parsed = JSON.parse(el.textContent);
      return Array.isArray(parsed.bars) ? parsed.bars : [];
    } catch {
      return [];
    }
  }

  // Geocode a bar name to get coordinates (for local JSON bars without lat/lon)
  async function geocodeName(name) {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(name)}&limit=1&apiKey=${GEOAPIFY_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const f = data.features?.[0];
    if (!f) return null;
    return {
      name,
      address: f.properties.formatted,
      distance: null,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    };
  }

  async function geocodeLocalBars(localBars, maxCount = 12) {
    const list = localBars.slice(0, maxCount); // throttle in dev to avoid rate limits
    const results = [];
    for (const item of list) {
      const g = await geocodeName(item.name);
      if (g) results.push(g);
      await new Promise(r => setTimeout(r, 120)); // polite delay
    }
    return results;
  }

  // -------- PUBLIC API (optional: callable from console) --------
  window.DealBuddyMap.api = {
    initMap,
    clearMarkers,
    plotBars,
    getUserLocation,
    fetchNearbyBars,
    loadLocalBars,
    geocodeLocalBars
  };

  // -------- DEFAULT WIRING (if page has common IDs) --------
  document.addEventListener('DOMContentLoaded', async () => {
    // auto-init if present
    const container = document.getElementById(state.mapContainerId);
    if (!container) return;

    // Initialize map once
    initMap(state.mapContainerId, 40.7934, -77.8600, 14);

    const localBars = loadLocalBars('bars');

    // Buttons (optional)
    const useLocBtn = document.getElementById('use-location');
    const showJsonBtn = document.getElementById('show-json');

    if (useLocBtn) {
      useLocBtn.addEventListener('click', async () => {
        try {
          const loc = await getUserLocation();
          const apiBars = await fetchNearbyBars(loc.lat, loc.lon);
          plotBars(apiBars, localBars);
          state.map.setView([loc.lat, loc.lon], 14);
        } catch (err) {
          console.error('Location/API error:', err);
          alert('Could not fetch nearby bars right now.');
        }
      });
    }

    if (showJsonBtn) {
      showJsonBtn.addEventListener('click', async () => {
        try {
          const geocoded = await geocodeLocalBars(localBars, 12);
          if (!geocoded.length) {
            alert('Could not geocode local bars. Try "Use My Location" instead.');
            return;
          }
          plotBars(geocoded, localBars);
          const first = geocoded[0];
          state.map.setView([first.lat, first.lon], 14);
        } catch (err) {
          console.error('Geocoding error:', err);
          alert('Could not geocode local bars.');
        }
      });
    }
  });
})();
