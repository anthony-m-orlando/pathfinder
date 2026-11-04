export class PlacesApi {
  constructor(client) {
    this.client = client;
  }

  /** Search points of interest by category within a geographic area or bounding radius */
  async search(categories, filter, options = {}) {
    return this.client.request('/v2/places', {
      categories: Array.isArray(categories) ? categories.join(',') : categories,
      filter,
      ...options,
    });
  }

  /** Retrieve detailed place attributes using a unique Geoapify place_id */
  async getDetails(placeId, options = {}) {
    return this.client.request('/v2/place-details', { id: placeId, ...options });
  }
}