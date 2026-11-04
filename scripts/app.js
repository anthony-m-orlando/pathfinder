import { GeoapifySDK } from './geo-api/index.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/styles.css';

const map = L.map('map').setView([40.7484, -73.9857], 14);
const status = document.querySelector('#status');
const addressResult = document.querySelector('#address-result');
const placesResult = document.querySelector('#places-result');
const routeResult = document.querySelector('#route-result');

L.tileLayer(
  '/api/geoapify/tiles/{z}/{x}/{y}.png',
  {
    attribution: '&copy; <a href="https://www.geoapify.com/">Geoapify</a> &copy; OpenStreetMap contributors',
    maxZoom: 20,
  },
).addTo(map);

const addressMarker = L.marker([40.7484, -73.9857]).addTo(map);
addressMarker.bindPopup('350 Fifth Ave, New York, NY');

async function runExample() {
  const geoapify = new GeoapifySDK();
  status.textContent = 'Loading Geoapify results…';

  try {
    const geocodeResult = await geoapify.geocoding.search('350 Fifth Ave, New York, NY');
    const address = geocodeResult.features[0];
    const [longitude, latitude] = address.geometry.coordinates;
    addressMarker.setLatLng([latitude, longitude]);
    addressMarker.bindPopup(address.properties.formatted ?? '350 Fifth Ave, New York, NY');
    addressResult.textContent = address.properties.formatted ?? '350 Fifth Ave, New York, NY';

    const places = await geoapify.places.search(
      ['catering.restaurant'],
      `circle:${longitude},${latitude},1000`,
    );
    places.features.forEach((place) => {
      const [placeLongitude, placeLatitude] = place.geometry.coordinates;
      const name = place.properties.name ?? 'Restaurant';
      L.circleMarker([placeLatitude, placeLongitude], {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#e26645',
        fillOpacity: 1,
      }).addTo(map).bindPopup(name);
    });
    placesResult.textContent = `${places.features.length} restaurants found within 1 km.`;

    const waypoints = [
      { lat: latitude, lon: longitude },
      { lat: 40.7589, lon: -73.9851 },
    ];
    const route = await geoapify.routing.calculateRoute(waypoints, 'drive');
    const routeFeature = route.features[0];
    const routeCoordinates = routeFeature.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    L.polyline(routeCoordinates, { color: '#315fbd', weight: 5, opacity: 0.85 }).addTo(map);
    map.fitBounds(L.latLngBounds(routeCoordinates).pad(0.15));
    const distanceKm = (routeFeature.properties.distance / 1000).toFixed(1);
    routeResult.textContent = `${distanceKm} km driving route to 40.7589, -73.9851.`;
    status.textContent = 'Map and examples loaded.';
  } catch (err) {
    status.textContent = `Unable to load examples: ${err.message}`;
    placesResult.textContent = 'See the status above for details.';
    routeResult.textContent = 'See the status above for details.';
    console.error('Geoapify example failed:', err);
  }
}

runExample();
