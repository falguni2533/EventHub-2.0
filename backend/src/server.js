import dns from 'node:dns';
import app from './app.js';
import { env, redactMongoCredentials, validateEnv } from './config/env.js';
import {
  connectDatabase,
  disconnectDatabase,
  isNonRetryableMongoError,
} from './config/db.js';

const STARTUP_RETRY_BASE_MS = 5000;
const STARTUP_RETRY_MAX_MS = 30000;

// Use public DNS servers to fix "querySrv ECONNREFUSED"
dns.setServers(['8.8.8.8', '1.1.1.1']);

let server;
let isShuttingDown = false;
let startupRetryTimer = null;

const waitWithCancellation = (delayMs) =>
  new Promise((resolve) => {
    startupRetryTimer = setTimeout(() => {
      startupRetryTimer = null;
      resolve();
    }, delayMs);
  });

const connectWithStartupBackoff = async () => {
  let attempt = 0;

  while (!isShuttingDown) {
    attempt += 1;
    try {
      await connectDatabase();
      return true;
    } catch (error) {
      const safeMessage = redactMongoCredentials(
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        `[Startup] MongoDB connection attempt #${attempt} failed: ${safeMessage}`
      );

      if (isNonRetryableMongoError(error)) {
        throw error;
      }

      if (isShuttingDown) {
        return false;
      }

      const delayMs = Math.min(
        STARTUP_RETRY_BASE_MS * 2 ** (attempt - 1),
        STARTUP_RETRY_MAX_MS
      );
      console.warn(
        `[Startup] Waiting ${Math.round(
          delayMs / 1000
        )}s before retrying MongoDB connection (server will listen once connected)...`
      );
      await waitWithCancellation(delayMs);
    }
  }

  return false;
};

const startServer = async () => {
  try {
    validateEnv();
    const connected = await connectWithStartupBackoff();
    if (!connected || isShuttingDown) return;

    server = app.listen(env.port, () => {
      console.log(
        `[Server] EventHub API running in ${env.nodeEnv} mode on http://localhost:${env.port}`
      );
    });
  } catch (error) {
    const safeMessage = redactMongoCredentials(
      error instanceof Error ? error.message : String(error)
    );
    console.error('[Startup] Failed to start EventHub backend:', safeMessage);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (startupRetryTimer) {
    clearTimeout(startupRetryTimer);
    startupRetryTimer = null;
  }

  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      console.log('[Server] Closed cleanly.');
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error(
    '[Server] Unhandled promise rejection:',
    redactMongoCredentials(message)
  );
});

startServer();