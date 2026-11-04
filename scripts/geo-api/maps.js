export class MapsApi {
  constructor(client) {
    this.client = client;
  }

  /** Generate a static map image rendered as a Blob */
  async getStaticMap(params = {}) {
    return this.client.request('/v1/staticmap', params);
  }

  /** Create custom map marker SVG/PNG icons */
  async getMarkerIcon(params = {}) {
    return this.client.request('/v2/icon', params);
  }
}