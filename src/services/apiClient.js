// Mock REST API Client Abstraction for Backend-Ready Architecture

export const apiClient = {
  /**
   * Simulated GET request wrapper
   */
  async get(url, params = {}) {
    // Simulate realistic asynchronous network latency (30ms - 80ms)
    await new Promise((resolve) => setTimeout(resolve, 40));
    return { status: 200, url, params };
  },

  /**
   * Simulated POST request wrapper
   */
  async post(url, payload = {}) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return { status: 201, url, data: payload };
  },

  /**
   * Simulated PATCH request wrapper
   */
  async patch(url, payload = {}) {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return { status: 200, url, data: payload };
  }
};
