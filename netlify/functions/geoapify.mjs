// Server-side proxy for Geoapify so the API key never reaches the browser.
// The key is read from the GEOAPIFY_API_KEY environment variable at request time.

const API_BASE = 'https://api.geoapify.com';
const TILE_BASE = 'https://maps.geoapify.com/v1/tile/osm-carto';

// Only endpoints used by the app's SDK wrapper are forwarded.
const ALLOWED_API_PATHS = new Set([
  '/v1/geocode/search',
  '/v1/geocode/reverse',
  '/v1/geocode/autocomplete',
  '/v1/ipinfo',
  '/v1/routing',
  '/v1/routematrix',
  '/v1/isoline',
  '/v2/places',
  '/v2/place-details',
  '/v1/staticmap',
  '/v2/icon',
]);

const TILE_PATTERN = /^\/(\d{1,2})\/(\d+)\/(\d+)\.png$/;

function json(status, body) {
  return Response.json(body, { status });
}

export default async (request) => {
  const apiKey = Netlify.env.get('GEOAPIFY_API_KEY');
  if (!apiKey) {
    return json(500, { message: 'GEOAPIFY_API_KEY is not configured on the server.' });
  }

  const url = new URL(request.url);

  // Map tiles: /api/geoapify/tiles/{z}/{x}/{y}.png
  if (url.pathname.startsWith('/api/geoapify/tiles/')) {
    const match = url.pathname.slice('/api/geoapify/tiles'.length).match(TILE_PATTERN);
    if (!match || request.method !== 'GET') {
      return json(400, { message: 'Invalid tile request.' });
    }
    const [, z, x, y] = match;
    const upstream = await fetch(`${TILE_BASE}/${z}/${x}/${y}.png?apiKey=${encodeURIComponent(apiKey)}`);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'Netlify-CDN-Cache-Control': 'public, durable, max-age=2592000',
      },
    });
  }

  // REST API: /api/geoapify/v1/... and /api/geoapify/v2/...
  const endpoint = url.pathname.slice('/api/geoapify'.length);
  if (!ALLOWED_API_PATHS.has(endpoint)) {
    return json(404, { message: 'Unsupported Geoapify endpoint.' });
  }
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json(405, { message: 'Method not allowed.' });
  }

  const target = new URL(`${API_BASE}${endpoint}`);
  url.searchParams.forEach((value, key) => {
    if (key.toLowerCase() !== 'apikey') target.searchParams.append(key, value);
  });
  target.searchParams.set('apiKey', apiKey);

  const init = {
    method: request.method,
    headers: { Accept: request.headers.get('accept') ?? 'application/json' },
  };
  if (request.method === 'POST') {
    init.headers['Content-Type'] = request.headers.get('content-type') ?? 'application/json';
    init.body = await request.text();
  }

  const upstream = await fetch(target, init);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });
};

export const config = {
  path: ['/api/geoapify/*'],
};
