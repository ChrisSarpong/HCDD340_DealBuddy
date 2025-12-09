// API KEYS
const ABSTRACT_API_KEY = "a5591e99f3e54e4986121126251cbced";
const GEOAPIFY_API_KEY = "6699cb284b6b4e99a3baeb3d4d6c8103";

let userLocation = null;

document.querySelector(".button").addEventListener("click", async (event) => {
  event.preventDefault(); // prevent page reload if it's an <a> tag
  console.log("🔍 Starting search for nearby bars...");

  try {
    // Step 1: Get user location
    userLocation = await getUserLocation();
    console.log("📍 User location:", userLocation);

    // Step 2: Fetch bars from Geoapify
    const bars = await fetchNearbyBars(userLocation.lat, userLocation.lon);
    console.log("🍸 Nearby Bars:");
    bars.forEach((bar, i) => {
      console.log(`${i + 1}. ${bar.name || "Unnamed"} — ${bar.address}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
});

// ====================== FUNCTIONS ======================

// Get user location (HTML5 -> fallback to AbstractAPI)
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        async (err) => {
          console.warn(
            "⚠️ Geolocation blocked or unavailable, using IP lookup..."
          );
          try {
            const res = await fetch(
              `https://ipgeolocation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}`
            );
            const data = await res.json();
            resolve({ lat: data.latitude, lon: data.longitude });
          } catch (ipErr) {
            reject("Could not determine location.");
          }
        }
      );
    } else {
      console.warn(
        "⚠️ Browser doesn’t support geolocation. Using IP lookup..."
      );
      fetch(
        `https://ipgeolocation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}`
      )
        .then((res) => res.json())
        .then((data) => resolve({ lat: data.latitude, lon: data.longitude }))
        .catch((err) => reject(err));
    }
  });
}

// Fetch bars from Geoapify
async function fetchNearbyBars(lat, lon) {
  const radius = 2000; // 2 km search radius
  const categories = "catering.bar"; // category for bars
  const limit = 10;

  const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.features.map((f) => ({
    name: f.properties.name,
    address: f.properties.address_line2,
    distance: f.properties.distance,
  }));
}

// Search Functionality
// Load JSON file
// ----------------- Search Functionality (embedded JSON, no fetch/server) -----------------
document.addEventListener('DOMContentLoaded', () => {
  const jsonEl = document.getElementById('bars');
  if (!jsonEl) {
    console.error('bars JSON script block not found.');
    return;
  }

  let data = [];
  try {
    const parsed = JSON.parse(jsonEl.textContent);
    data = Array.isArray(parsed.bars) ? parsed.bars : [];
  } catch (err) {
    console.error('Failed to parse embedded bars JSON:', err);
    return;
  }

  const searchInput = document.getElementById('search-input');
  const suggestionsBox = document.getElementById('suggestions');
  const resultsBox = document.getElementById('results');
  const searchButton = document.getElementById('search-button');

  if (!searchInput || !suggestionsBox || !resultsBox || !searchButton) {
    console.error('One or more required elements are missing in the HTML.');
    return;
  }
// Render results
const renderResults = (list) => {
  if (!Array.isArray(list) || !list.length) {
    resultsBox.innerHTML = '<p>No results found.</p>';
    return;
  }

  resultsBox.innerHTML = list.map(r => `
    <div class="result-item">
      <img src="${r.image}" alt="${r.name}"etails">
        <h4>${r.name}</h4>
        <p>${r.deal}</p>
      </div>
    </div>
  `).join('');
};




  // Suggestions
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    suggestionsBox.innerHTML = '';

    if (!query) {
      suggestionsBox.style.display = 'none';
      return;
    }

    const matches = data.filter(item => item.name.toLowerCase().includes(query)).slice(0, 5);

    if (matches.length) {
      suggestionsBox.style.display = 'block';
      matches.forEach(match => {
        const div = document.createElement('div'); // styled via #suggestions div in styles.css
        div.textContent = match.name;
        div.addEventListener('click', () => {
          searchInput.value = match.name;
          suggestionsBox.style.display = 'none';
          renderResults([match]);
        });
        suggestionsBox.appendChild(div);
      });
    } else {
      suggestionsBox.style.display = 'none';
    }
  });

// Helper to help with the spelling of the bard
const normalize = (s) => (s || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '') // remove spaces and punctuation
  .trim();

// Search button
searchButton.addEventListener('click', async () => {
  const query = searchInput.value.toLowerCase().trim();

  // Case 1: Query provided -> filter local JSON bars by name
  if (query) {
    const results = data.filter(item =>
      item.name.toLowerCase().includes(query)
    );
    suggestionsBox.style.display = 'none';
    renderResults(results);
    return;
  }

  // Case 2: Empty query -> use location + Geoapify to show only nearby local bars
  suggestionsBox.style.display = 'none';

  try {
    // 1) Get user location (HTML5 -> fallback to AbstractAPI)
    const loc = await getUserLocation();              // already defined above
    // 2) Fetch nearby bars from Geoapify
    const apiBars = await fetchNearbyBars(loc.lat, loc.lon); // already defined above

    // Build a lookup for quick matching & optional distance display
    const nearbyNameSet = new Set();
    const distanceByName = new Map();
    apiBars.forEach(b => {
      const key = normalize(b.name || '');
      if (key) {
        nearbyNameSet.add(key);
        if (typeof b.distance === 'number') {
          distanceByName.set(key, b.distance);
        }
      }
    });

    // Intersect API results with your local embedded JSON bars by name
    const filtered = data.filter(item => nearbyNameSet.has(normalize(item.name)));

    // Render the filtered local bars
    renderResults(filtered);

    // (Optional) If you want to display distance, we can extend renderResults
    // to read distanceByName—tell me and I’ll drop that in.

  } catch (err) {
    console.error('❌ Nearby search failed:', err);
    resultsBox.innerHTML = `
      <p>Couldn’t fetch nearby bars right now. Showing all bars instead.</p>
    `;
    renderResults(data); // graceful fallback
  }
});


  // Search button
  searchButton.addEventListener('click', () => {
    const query = searchInput.value.toLowerCase().trim();
    const results = data.filter(item => item.name.toLowerCase().includes(query));
    suggestionsBox.style.display = 'none';
    renderResults(results);
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
      suggestionsBox.style.display = 'none';
    }
  });

  // Initial render (optional): show all bars
  renderResults(data);
});
