const BASE = import.meta.env.VITE_API_URL || '';

const getBaseURL = () => {
  if (BASE) return BASE;
  if (typeof window !== 'undefined' && window.location.port === '3000') {
    return ''; // Vite proxy in dev
  }
  return '';
};

const axios = {
  defaults: { headers: { common: {} } },
  get(url, config = {}) {
    return fetch(getBaseURL() + url, {
      ...config,
      headers: { ...this.defaults.headers.common, ...config.headers },
    }).then(handleResponse);
  },
  post(url, data, config = {}) {
    return fetch(getBaseURL() + url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaults.headers.common,
        ...config.headers,
      },
      ...config,
    }).then(handleResponse);
  },
  patch(url, data, config = {}) {
    return fetch(getBaseURL() + url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaults.headers.common,
        ...config.headers,
      },
      ...config,
    }).then(handleResponse);
  },
  delete(url, config = {}) {
    return fetch(getBaseURL() + url, {
      method: 'DELETE',
      headers: { ...this.defaults.headers.common, ...config.headers },
      ...config,
    }).then(handleResponse);
  },
};

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || 'Request failed');
    err.response = { data, status: res.status };
    throw err;
  }
  return { data, status: res.status };
}

export const api = axios;
