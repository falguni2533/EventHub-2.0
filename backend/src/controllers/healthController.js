import { getHealthStatus } from '../services/healthService.js';

/**
 * GET /api/health
 * Returns API health and live MongoDB connection state.
 */
export const checkHealth = (req, res, next) => {
  try {
    const payload = getHealthStatus();
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
