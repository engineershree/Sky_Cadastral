const RENDER_PROD_URL = 'https://sky-cadastral.onrender.com';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || RENDER_PROD_URL).replace(/\/+$/, '');

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const apiClient = {
  async get(url, params = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ).toString();
    const fullUrl = `${API_BASE}${url}${query ? `?${query}` : ''}`;
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return parseJsonResponse(response);
  },

  async post(url, payload = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(response);
  },

  async patch(url, payload = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(response);
  },
};
