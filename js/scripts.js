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
const jsonEl = document.getElementById('bars');
const data = JSON.parse(jsonEl.textContent).bars;

const searchInput = document.getElementById('search-input');
const suggestionsBox = document.getElementById('suggestions');
const resultsBox = document.getElementById('results');

// Show suggestions as user types
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  suggestionsBox.innerHTML = '';

  if (query.length === 0) {
    suggestionsBox.style.display = 'none';
    return;
  }

  const matches = data.filter(item => item.name.toLowerCase().includes(query));

  if (matches.length > 0) {
    suggestionsBox.style.display = 'block';
    matches.slice(0, 5).forEach(match => {
      const div = document.createElement('div');
      div.textContent = match.name;
      div.addEventListener('click', () => {
        searchInput.value = match.name;
        suggestionsBox.style.display = 'none';
      });
      suggestionsBox.appendChild(div);
    });
  } else {
    suggestionsBox.style.display = 'none';
  }
});

// Handle search button click
document.getElementById('search-button').addEventListener('click', () => {
  const query = searchInput.value.toLowerCase();
  const results = data.filter(item => item.name.toLowerCase().includes(query));

resultsBox.innerHTML = results.map(r => `
  <div class="result-item">
    <img src="${r.image}" alt="${r.name}" style="width:100px;">${r.deal}</p>
    </div>
  </div>
`).join('');

});

    