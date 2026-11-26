import { env } from '../config/env.js';
import { getDatabaseStatus } from '../config/db.js';
import { getAiEngineStatus } from './analyzeService.js';

/**
 * Builds the health check payload with live API and MongoDB status.
 */
export const getHealthStatus = () => {
  const database = getDatabaseStatus();

  return {
    success: true,
    service: 'EventHub API',
    phase: 'Phase 0 - Project Setup',
    status: database.connected ? 'healthy' : 'degraded',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database,
    providers: getAiEngineStatus(),
  };
};
