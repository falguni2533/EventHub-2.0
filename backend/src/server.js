import dns from 'node:dns';
import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

// Use public DNS servers to fix "querySrv ECONNREFUSED"
dns.setServers(['8.8.8.8', '1.1.1.1']);

let server;

const startServer = async () => {
  try {
    validateEnv();
    await connectDatabase();

    server = app.listen(env.port, () => {
      console.log(
        `[Server] EventHub API running in ${env.nodeEnv} mode on http://localhost:${env.port}`
      );
    });
  } catch (error) {
    console.error('[Startup] Failed to start EventHub backend:', error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
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
  console.error('[Server] Unhandled promise rejection:', message);
});

startServer();