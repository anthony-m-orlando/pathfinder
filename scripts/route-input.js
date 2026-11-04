function decodePathSegment(segment) {
  try {
    return decodeURIComponent(segment.replace(/\+/g, ' ')).trim();
  } catch {
    return segment.replace(/\+/g, ' ').trim();
  }
}

function splitWaypoints(value) {
  return value.split('|').map((stop) => stop.trim()).filter(Boolean);
}

export function isShortGoogleMapsLink(input) {
  try {
    const url = new URL(input.startsWith('www.') ? `https://${input}` : input);
    return url.protocol === 'https:'
      && (url.hostname === 'maps.app.goo.gl' || url.hostname === 'goo.gl');
  } catch {
    return false;
  }
}

export function parseRouteInput(input) {
  const value = input.trim();
  if (!value) {
    throw new Error('Paste a Google Maps directions link or enter stops, one per line.');
  }

  if (/^(https?:\/\/|www\.)/i.test(value)) {
    let url;
    try {
      url = new URL(value.startsWith('www.') ? `https://${value}` : value);
    } catch {
      throw new Error('That does not look like a valid web link.');
    }

    if (isShortGoogleMapsLink(value)) {
      throw new Error('Could not expand that short Google Maps link. Try pasting the full directions link instead.');
    }
    if (!/(^|\.)google\.(?:com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/i.test(url.hostname)) {
      throw new Error('Paste a Google Maps directions link, or enter stops one per line.');
    }

    const params = url.searchParams;
    if (params.get('api') === '1') {
      const origin = params.get('origin');
      const destination = params.get('destination');
      const waypoints = params.get('waypoints') ?? '';
      const stops = [
        ...(origin ? [origin] : []),
        ...splitWaypoints(waypoints),
        ...(destination ? [destination] : []),
      ];
      if (stops.length >= 2) {
        return stops;
      }
    }

    const oldOrigin = params.get('saddr');
    const oldDestination = params.get('daddr');
    if (oldOrigin && oldDestination) {
      return [oldOrigin, oldDestination];
    }

    const dirMarker = '/maps/dir/';
    const dirIndex = url.pathname.indexOf(dirMarker);
    if (dirIndex !== -1) {
      const path = url.pathname.slice(dirIndex + dirMarker.length).split('/@')[0];
      const stops = path
        .split('/')
        .map(decodePathSegment)
        .filter((segment) => segment && !segment.startsWith('data=') && !segment.startsWith('!'));
      if (stops.length >= 2) {
        return stops;
      }
    }

    throw new Error('No route stops found. Paste a full directions link with an origin and destination.');
  }

  const stops = value.split(/\r?\n/).map((stop) => stop.trim()).filter(Boolean);
  if (stops.length < 2) {
    throw new Error('Add at least an origin and a destination, one stop per line.');
  }
  return stops;
}
