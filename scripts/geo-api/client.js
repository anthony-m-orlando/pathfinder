/**
 * Core HTTP Client wrapper for Geoapify APIs.
 */
export class GeoapifyClient {
  /**
   * @param {string} apiKey - Your Geoapify API key.
   * @param {string} [baseUrl='https://api.geoapify.com'] - Geoapify API base endpoint.
   */
  constructor(apiKey, baseUrl = 'https://api.geoapify.com') {
    if (!apiKey) {
      throw new Error('Geoapify API key is required.');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Universal fetch helper handling URL query parameters and JSON responses.
   * @param {string} endpoint - Path relative to base URL (e.g., '/v1/geocode/search')
   * @param {Object} [params={}] - Key-value pair query parameters
   * @param {RequestInit} [options={}] - Standard fetch options (headers, method, body)
   * @returns {Promise<any>} Response payload parsed as JSON or Blob
   */
  async request(endpoint, params = {}, options = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Externalized API key attached to every request
    url.searchParams.append('apiKey', this.apiKey);

    // Append custom query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(`Geoapify API Error [${response.status}]: ${errorMessage}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.blob();
  }
}