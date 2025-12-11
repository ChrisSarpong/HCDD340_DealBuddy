// /js/mapping.js
(function () {
  // -------- CONFIG --------
  const GEOAPIFY_API_KEY = "6699cb284b6b4e99a3baeb3d4d6c8103";
  const ABSTRACT_API_KEY = "a5591e99f3e54e4986121126251cbced";

  // -------- GLOBAL STATE (prevents double-map init) --------
  window.DealBuddyMap = window.DealBuddyMap || {};
  const state =
    window.DealBuddyMap.state ||
    (window.DealBuddyMap.state = {
      map: null,
      markersLayer: null,
      mapContainerId: "map",
    });

  // -------- UTIL --------
  const normalize = (s) =>
    (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

  // -------- MAP INITIALIZATION --------
  function initMap(
    mapContainerId = "map",
    centerLat = 40.7934,
    centerLon = -77.86,
    zoom = 14
  ) {
    state.mapContainerId = mapContainerId;

    const container = document.getElementById(mapContainerId);
    if (!container) {
      console.error(`Map container #${mapContainerId} not found.`);
      return;
    }

    if (!window.L) {
      console.error("Leaflet is not loaded.");
      return;
    }

    // Avoid duplicate Leaflet initialization
    if (container._leaflet_id) container._leaflet_id = null;

    // Create map
    state.map = L.map(mapContainerId).setView([centerLat, centerLon], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(state.map);

    state.markersLayer = L.layerGroup().addTo(state.map);
  }

  // -------- MARKER HANDLING --------
  function clearMarkers() {
    if (state.markersLayer) state.markersLayer.clearLayers();
  }

  function plotBars(bars, localData = []) {
    if (!state.map || !Array.isArray(bars)) return;

    clearMarkers();
    const bounds = [];

    bars.forEach((b) => {
      if (typeof b.lat !== "number" || typeof b.lon !== "number") return;

      // match local JSON bar by normalized name
      const local = localData.find(
        (item) => normalize(item.name) === normalize(b.name)
      );

      const popupHtml = `
        <div style="min-width:220px">
          <div style="font-weight:700;margin-bottom:4px;">${b.name || "Unnamed"}</div>
          ${
            typeof b.distance === "number"
              ? `<div><strong>${Math.round(b.distance)} m away</strong></div>`
              : ""
          }
          <div>${b.address || ""}</div>
          ${local?.image || ""}
          ${local?.deal ? `<div>${local.deal}</div>` : ""}
        </div>
      `;

      L.marker([b.lat, b.lon])
        .addTo(state.markersLayer)
        .bindPopup(popupHtml)
        .bindTooltip(b.name || "Bar", { direction: "top" });

      bounds.push([b.lat, b.lon]);
    });

    if (bounds.length) {
      state.map.fitBounds(bounds, { padding: [24, 24] });
    }
  }

  // -------- API: USER LOCATION --------
  async function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("No geolocation support");

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        async () => {
          try {
            const res = await fetch(
              `https://ipgeolocation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}`
            );
            const data = await res.json();
            resolve({
              lat: data.latitude,
              lon: data.longitude,
            });
          } catch {
            reject("Could not determine location.");
          }
        }
      );
    });
  }

  // -------- API: NEARBY BARS --------
  async function fetchNearbyBars(lat, lon) {
    const radius = 2000; // meters
    const categories = "catering.bar";
    const limit = 20;

    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    return (data.features || []).map((f) => ({
      name: f.properties.name,
      address: f.properties.address_line2 || f.properties.formatted,
      distance: f.properties.distance,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    }));
  }

  // -------- LOCAL JSON HANDLING --------
  function loadLocalBars(id = "bars") {
    const el = document.getElementById(id);
    if (!el) return [];
    try {
      const parsed = JSON.parse(el.textContent);
      return Array.isArray(parsed.bars) ? parsed.bars : [];
    } catch {
      return [];
    }
  }

  async function geocodeName(name) {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(name + " State College PA")}&limit=1&apiKey=${GEOAPIFY_API_KEY}`;


    const res = await fetch(url);
    const data = await res.json();

    const f = data.features?.[0];
    if (!f) return null;

    return {
      name,
      address: f.properties.formatted,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    };
  }

  async function geocodeLocalBars(localBars, max = 12) {
    const result = [];

    for (let i = 0; i < Math.min(localBars.length, max); i++) {
      const g = await geocodeName(localBars[i].name);
      if (g) result.push(g);
      await new Promise((r) => setTimeout(r, 120));
    }

    return result;
  }

  // -------- PUBLIC API (for debugging if needed) --------
  window.DealBuddyMap.api = {
    initMap,
    clearMarkers,
    plotBars,
    getUserLocation,
    fetchNearbyBars,
    loadLocalBars,
    geocodeLocalBars,
  };

  // -------- BOOTSTRAP ON PAGE LOAD --------
  document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById(state.mapContainerId);
    if (!container) return;

    initMap(state.mapContainerId);

    const localBars = loadLocalBars("bars");

    // Optional buttons
    const useLocBtn = document.getElementById("use-location");
    const showJsonBtn = document.getElementById("show-json");

    if (useLocBtn) {
      useLocBtn.addEventListener("click", async () => {
        try {
          const loc = await getUserLocation();
          const apiBars = await fetchNearbyBars(loc.lat, loc.lon);
          plotBars(apiBars, localBars);
          state.map.setView([loc.lat, loc.lon], 14);
        } catch (err) {
          console.error(err);
          alert("Could not fetch nearby bars.");
        }
      });
    }

    if (showJsonBtn) {
      showJsonBtn.addEventListener("click", async () => {
        try {
          const geocoded = await geocodeLocalBars(localBars, 12);
          if (geocoded.length === 0) {
            alert("Could not geocode local bars.");
            return;
          }
          plotBars(geocoded, localBars);
          state.map.setView([geocoded[0].lat, geocoded[0].lon], 14);
        } catch (err) {
          console.error(err);
          alert("Could not geocode local bars.");
        }
      });
    }
  });
})();
