import apiClient from './apiClient';

/**
 * Fetches backend API health and live MongoDB connection state.
 */
export const checkBackendHealth = async () => {
  const start = performance.now();
  const response = await apiClient.get('/health');
  const latencyMs = Math.round(performance.now() - start);

  return {
    ...response.data,
    latencyMs,
  };
};
