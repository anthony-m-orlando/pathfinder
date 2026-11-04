# pathfinder

## Run locally

1. Copy `.env.example` to `.env` and set `GEOAPIFY_API_KEY`.
2. Run `npm install`.
3. Run `netlify dev` (the Netlify CLI) so the `/api/geoapify` proxy function runs locally and can read `GEOAPIFY_API_KEY`. Plain `npm run dev` serves the pages but Geoapify requests will fail without the function.

## Deploy automatically with Netlify

1. Push this repository to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**, connect GitHub, and select this repository.
3. Netlify reads `netlify.toml` to run `npm run build`, publish `dist`, and deploy the Google Maps short-link function.
4. In the Netlify site settings, add `GEOAPIFY_API_KEY` under **Environment variables** for the production deploy context. Add it to deploy previews too if previews need to use the map and routing APIs.
5. Trigger the first deploy. After that, Netlify automatically builds and deploys commits pushed to the connected production branch and creates deploy previews for pull requests.

The Geoapify key stays on the server. The browser calls `/api/geoapify/...` (geocoding, routing, places, map tiles), and the `geoapify` Netlify Function attaches `GEOAPIFY_API_KEY` before forwarding the request to Geoapify. Only an allowlist of Geoapify endpoints is proxied.