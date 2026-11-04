export class RoutingApi {
  constructor(client) {
    this.client = client;
  }

  /** Calculate routes and turn-by-turn directions */
  async calculateRoute(waypoints, mode = 'drive', options = {}) {
    const formattedWaypoints = waypoints.map(wp => `${wp.lat},${wp.lon}`).join('|');
    return this.client.request('/v1/routing', {
      waypoints: formattedWaypoints,
      mode,
      ...options,
    });
  }

  /** Compute travel distance and time matrix between multi-origin and multi-destination sets */
  async getMatrix(origins, destinations, mode = 'drive', options = {}) {
    return this.client.request('/v1/routematrix', {}, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origins, destinations, mode, ...options }),
    });
  }

  /** Calculate isoline polygons representing reachable areas by time or distance */
  async getIsoline(lat, lon, type = 'time', mode = 'drive', range, options = {}) {
    return this.client.request('/v1/isoline', {
      lat,
      lon,
      type,
      mode,
      range,
      ...options,
    });
  }
}