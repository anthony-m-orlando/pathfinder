import { GeoapifyClient } from './client.js';
import { GeocodingApi } from './geocoding.js';
import { RoutingApi } from './routing.js';
import { PlacesApi } from './places.js';
import { MapsApi } from './maps.js';

export class GeoapifySDK {
  /**
   * Initializes the Geoapify SDK with an externalized API key.
   * @param {string} apiKey 
   * @param {Object} [config={}]
   */
  constructor(apiKey, config = {}) {
    this.client = new GeoapifyClient(apiKey, config.baseUrl);
    
    this.geocoding = new GeocodingApi(this.client);
    this.routing = new RoutingApi(this.client);
    this.places = new PlacesApi(this.client);
    this.maps = new MapsApi(this.client);
  }
}

export { GeoapifyClient, GeocodingApi, RoutingApi, PlacesApi, MapsApi };