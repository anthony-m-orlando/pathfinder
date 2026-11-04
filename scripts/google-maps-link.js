const shortGoogleMapsHosts = new Set(['maps.app.goo.gl', 'goo.gl']);
const googleMapsHostPattern = /(^|\.)google\.(?:com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/i;

export async function expandShortGoogleMapsLink(value) {
  let currentUrl;
  try {
    currentUrl = new URL(value);
  } catch {
    throw new Error('Enter a valid Google Maps short link.');
  }

  if (currentUrl.protocol !== 'https:' || !shortGoogleMapsHosts.has(currentUrl.hostname)) {
    throw new Error('Only HTTPS Google Maps short links can be expanded.');
  }

  for (let redirects = 0; redirects < 5; redirects += 1) {
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    const location = response.headers.get('location');
    await response.body?.cancel();

    if (!location) {
      throw new Error('Google Maps did not redirect this short link to a directions page.');
    }

    currentUrl = new URL(location, currentUrl);
    if (googleMapsHostPattern.test(currentUrl.hostname)) {
      return currentUrl.href;
    }
    if (currentUrl.protocol !== 'https:' || !shortGoogleMapsHosts.has(currentUrl.hostname)) {
      throw new Error('The short link redirected to an unsupported address.');
    }
  }

  throw new Error('The Google Maps short link redirected too many times.');
}
