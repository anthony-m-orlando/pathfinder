import { defineConfig } from 'vite';
import { expandShortGoogleMapsLink } from './scripts/google-maps-link.js';

function googleMapsLinkExpansionPlugin() {
  const middleware = async (request, response, next) => {
    if (request.method !== 'GET') {
      next();
      return;
    }

    const requestUrl = new URL(request.url, 'http://localhost');
    const shortUrl = requestUrl.searchParams.get('url');
    if (!shortUrl) {
      response.statusCode = 400;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: 'A Google Maps short link is required.' }));
      return;
    }

    try {
      const url = await expandShortGoogleMapsLink(shortUrl);
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ url }));
    } catch (error) {
      response.statusCode = 400;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: error.message }));
    }
  };

  return {
    name: 'google-maps-short-link-expansion',
    configureServer(server) {
      server.middlewares.use('/api/expand-google-maps-link', middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/expand-google-maps-link', middleware);
    },
  };
}

export default defineConfig({
  plugins: [googleMapsLinkExpansionPlugin()],
  envPrefix: ['GEOAPIFY_'],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        route: 'route.html',
      },
    },
  },
});
