function isCoordinate(value) {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(value[0])
    && Number.isFinite(value[1]);
}

function getCoordinateLines(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  if (value.every(isCoordinate)) {
    return [value.map(([first, second]) => [first, second])];
  }
  return value.flatMap(getCoordinateLines);
}

function distanceBetween(a, b) {
  const latitudeDifference = a[0] - b[0];
  const longitudeDifference = (a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(latitudeDifference, longitudeDifference);
}

export function getRouteCoordinateLines(coordinates, stops) {
  const coordinateLines = getCoordinateLines(coordinates);
  if (!coordinateLines.length || coordinateLines.some((line) => line.length < 2)) {
    throw new Error('Geoapify returned route geometry in an unsupported format.');
  }

  const asLongitudeLatitude = coordinateLines.map((line) =>
    line.map(([longitude, latitude]) => [latitude, longitude]),
  );
  const asLatitudeLongitude = coordinateLines.map((line) =>
    line.map(([latitude, longitude]) => [latitude, longitude]),
  );
  const isValid = (lines) => lines.every((line) => line.every(([latitude, longitude]) =>
    Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90
    && Math.abs(longitude) <= 180,
  ));
  const endpointScore = (lines) => {
    const first = lines[0][0];
    const lastLine = lines[lines.length - 1];
    const last = lastLine[lastLine.length - 1];
    return distanceBetween(first, [stops[0].lat, stops[0].lon])
      + distanceBetween(last, [stops[stops.length - 1].lat, stops[stops.length - 1].lon]);
  };

  const validCandidates = [asLongitudeLatitude, asLatitudeLongitude].filter(isValid);
  if (!validCandidates.length) {
    throw new Error('Geoapify returned route coordinates outside valid latitude/longitude ranges.');
  }
  return validCandidates.reduce((best, candidate) =>
    endpointScore(candidate) < endpointScore(best) ? candidate : best,
  );
}
