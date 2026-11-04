export class GeocodingApi {
  constructor(client) {
    this.client = client;
  }

  /** Convert structured text addresses into geographic coordinates */
  async search(text, options = {}) {
    return this.client.request('/v1/geocode/search', { text, ...options });
  }

  /** Convert geographic coordinates (latitude, longitude) into structured addresses */
  async reverse(lat, lon, options = {}) {
    return this.client.request('/v1/geocode/reverse', { lat, lon, ...options });
  }

  /** Real-time address and location suggestions for search inputs */
  async autocomplete(text, options = {}) {
    return this.client.request('/v1/geocode/autocomplete', { text, ...options });
  }

  /** Look up location details based on IP address */
  async ipLookup(ipAddress = '', options = {}) {
    const params = ipAddress ? { ip: ipAddress, ...options } : options;
    return this.client.request('/v1/ipinfo', params);
  }
}