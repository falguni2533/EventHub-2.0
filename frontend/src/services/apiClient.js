import axios from 'axios';

export const AUTH_TOKEN_KEY = 'eventhub_token';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status || 0;
    const requestUrl = error.config?.url || '';
    const isAuthAttempt =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (status === 401 && !isAuthAttempt) {
      window.dispatchEvent(new CustomEvent('eventhub:unauthorized'));
    }

    let message = error.response?.data?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED') {
        message = 'Request timed out while waiting for the EventHub server.';
      } else if (!error.response) {
        message =
          'Cannot reach EventHub backend server. Check that the backend is running on port 5000.';
      } else {
        message = error.message || 'Unable to reach EventHub API';
      }
    }

    return Promise.reject({
      status,
      message,
      raw: error,
    });
  }
);

export default apiClient;
