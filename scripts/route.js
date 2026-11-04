import { GeoapifySDK } from './geo-api/index.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/styles.css';
import { isShortGoogleMapsLink, parseRouteInput } from './route-input.js';
import { getRouteCoordinateLines } from './route-geometry.js';

const form = document.querySelector('#route-form');
const input = document.querySelector('#route-input');
const button = form.querySelector('button');
const status = document.querySelector('#route-status');
const summary = document.querySelector('#route-summary-text');
const stopHeading = document.querySelector('#stop-heading');
const stopList = document.querySelector('#stop-list');
const map = L.map('route-map').setView([40.7484, -73.9857], 12);
const routeLayers = L.featureGroup().addTo(map);

L.tileLayer(
  '/api/geoapify/tiles/{z}/{x}/{y}.png',
  {
    attribution: '&copy; <a href="https://www.geoapify.com/">Geoapify</a> &copy; OpenStreetMap contributors',
    maxZoom: 20,
  },
).addTo(map);

function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours} hr ${remainingMinutes} min` : `${minutes} min`;
}

async function resolveStop(geoapify, stop) {
  const coordinateMatch = stop.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (coordinateMatch) {
    const lat = Number(coordinateMatch[1]);
    const lon = Number(coordinateMatch[2]);
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw new Error(`Invalid coordinates: ${stop}`);
    }
    return { lat, lon, label: `${lat}, ${lon}` };
  }

  const result = await geoapify.geocoding.search(stop);
  const feature = result.features?.[0];
  if (!feature) {
    throw new Error(`Could not find a location for "${stop}".`);
  }
  const [lon, lat] = feature.geometry.coordinates;
  return {
    lat,
    lon,
    label: feature.properties.formatted ?? stop,
  };
}

function readOptimizedStopOrder(routeResponse, stops) {
  const candidates = [
    routeResponse.waypoints,
    routeResponse.features?.[0]?.properties?.waypoints,
  ];

  for (const waypoints of candidates) {
    if (!Array.isArray(waypoints) || waypoints.length !== stops.length) {
      continue;
    }

    const ordered = [...waypoints]
      .map((waypoint, index) => ({
        originalIndex: waypoint.original_index ?? waypoint.originalIndex ?? index,
        routeIndex: waypoint.waypoint_index ?? waypoint.waypointIndex,
      }))
      .filter(({ originalIndex, routeIndex }) =>
        Number.isInteger(originalIndex)
        && originalIndex >= 0
        && originalIndex < stops.length
        && Number.isInteger(routeIndex),
      )
      .sort((a, b) => a.routeIndex - b.routeIndex);

    if (ordered.length === stops.length) {
      return ordered.map(({ originalIndex }) => stops[originalIndex]);
    }
  }

  return null;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  routeLayers.clearLayers();
  stopList.replaceChildren();
  stopHeading.textContent = 'Locations provided';

  button.disabled = true;
  status.textContent = 'Reading route…';
  summary.textContent = 'Resolving locations and optimizing the route.';

  try {
    let routeInput = input.value.trim();
    if (isShortGoogleMapsLink(routeInput)) {
      status.textContent = 'Expanding Google Maps link…';
      const response = await fetch(`/api/expand-google-maps-link?url=${encodeURIComponent(routeInput)}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? 'Could not expand that Google Maps link.');
      }
      routeInput = result.url;
    }

    const stopNames = parseRouteInput(routeInput);
    if (stopNames.length > 12) {
      throw new Error('For this demo, a route can include up to 12 locations.');
    }

    const geoapify = new GeoapifySDK();
    status.textContent = `Finding ${stopNames.length} locations…`;
    const stops = await Promise.all(stopNames.map((stop) => resolveStop(geoapify, stop)));

    status.textContent = 'Optimizing stops and calculating the driving route…';
    const routeResponse = await geoapify.routing.calculateRoute(
      stops.map(({ lat, lon }) => ({ lat, lon })),
      'drive',
      { optimize_stops: true },
    );
    const routeFeature = routeResponse.features?.[0];
    const coordinates = routeFeature?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      throw new Error('Geoapify did not return a route for these locations.');
    }

    const routeCoordinateLines = getRouteCoordinateLines(coordinates, stops);
    routeCoordinateLines.forEach((line) => {
      if (line.length > 1) {
        L.polyline(line, { color: '#222', weight: 4 }).addTo(routeLayers);
      }
    });
    stops.forEach((stop, index) => {
      L.circleMarker([stop.lat, stop.lon], {
        radius: 6,
        color: '#fff',
        weight: 2,
        fillColor: '#222',
        fillOpacity: 1,
      }).addTo(routeLayers).bindPopup(`${index === 0 ? 'Start' : index === stops.length - 1 ? 'Finish' : 'Stop'}: ${stop.label}`);
    });
    const viewBounds = L.latLngBounds([
      ...routeCoordinateLines.flat(),
      ...stops.map(({ lat, lon }) => [lat, lon]),
    ]);
    map.fitBounds(viewBounds.pad(0.12));

    const properties = routeFeature.properties;
    const distance = (properties.distance / 1000).toFixed(1);
    const duration = formatDuration(properties.time);
    summary.textContent = `${stops.length} locations · ${distance} km · about ${duration}. Geoapify optimizes intermediate stops while keeping the first and last locations fixed.`;

    const optimizedStops = readOptimizedStopOrder(routeResponse, stops);
    if (optimizedStops) {
      stopHeading.textContent = 'Optimized stop order';
      optimizedStops.forEach(({ label }) => {
        const item = document.createElement('li');
        item.textContent = label;
        stopList.append(item);
      });
    } else {
      stopHeading.textContent = 'Locations provided';
      stops.forEach(({ label }) => {
        const item = document.createElement('li');
        item.textContent = label;
        stopList.append(item);
      });
      summary.textContent += ' The route line is optimized; the API did not return a reordered stop list.';
    }

    status.textContent = 'Optimized route ready.';
  } catch (error) {
    status.textContent = error.message;
    summary.textContent = 'No route was calculated.';
    console.error('Route optimization failed:', error);
  } finally {
    button.disabled = false;
  }
});
