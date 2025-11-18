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
