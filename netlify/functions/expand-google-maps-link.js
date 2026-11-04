import { expandShortGoogleMapsLink } from '../../scripts/google-maps-link.js';

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { Allow: 'GET' },
      body: JSON.stringify({ error: 'Only GET requests are supported.' }),
    };
  }

  const shortUrl = event.queryStringParameters?.url;
  if (!shortUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'A Google Maps short link is required.' }),
    };
  }

  try {
    const url = await expandShortGoogleMapsLink(shortUrl);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
