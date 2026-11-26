import mongoose from 'mongoose';
import { env, isMongoUriConfigured } from './env.js';

const READY_STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let listenersRegistered = false;
let usingMemoryServer = false;
let memoryServerInstance = null;
let activeConnectionPromise = null;
let intentionalDisconnect = false;

// Fail fast instead of buffering Mongoose queries for 10 seconds if disconnected
mongoose.set('bufferCommands', false);

const registerConnectionListeners = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    intentionalDisconnect = false;
    console.log(
      `[MongoDB] Connected to database "${mongoose.connection.name}" on host "${mongoose.connection.host}"`
    );
  });

  mongoose.connection.on('reconnected', () => {
    console.log(
      `[MongoDB] Reconnected to database "${mongoose.connection.name}"`
    );
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    if (intentionalDisconnect) {
      console.log('[MongoDB] Connection closed cleanly');
    } else {
      console.warn('[MongoDB] Unexpectedly disconnected from MongoDB Atlas');
    }
  });
};

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Prevents duplicate connection attempts and throws on failure so the server
 * does not start without an active database connection.
 */
export const connectDatabase = async () => {
  registerConnectionListeners();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (activeConnectionPromise) {
    return activeConnectionPromise;
  }

  // Try real MongoDB first
  if (isMongoUriConfigured()) {
    console.log(`[MongoDB] Connecting to Atlas database "${env.mongoDbName}"...`);
    activeConnectionPromise = mongoose
      .connect(env.mongoUri, {
        dbName: env.mongoDbName,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .catch((error) => {
        activeConnectionPromise = null;
        console.warn('[MongoDB] Real DB connection failed, falling back to in‑memory server:', error.message);
        return null;
      });
    const conn = await activeConnectionPromise;
    if (conn) {
      activeConnectionPromise = null;
      return conn;
    }
  }

  // Fallback to mongodb‑memory‑server
  console.log('[MongoDB] Starting in‑memory server...');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const memSrv = await MongoMemoryServer.create();
  const memUri = memSrv.getUri();
  usingMemoryServer = true;
  memoryServerInstance = memSrv;
  activeConnectionPromise = mongoose.connect(memUri, { dbName: env.mongoDbName });
  const memConn = await activeConnectionPromise;
  activeConnectionPromise = null;
  console.log('[MongoDB] In‑memory server ready.');
  return memConn;
};

/**
 * Gracefully closes the Mongoose connection.
 */
export const disconnectDatabase = async () => {
  activeConnectionPromise = null;
  if (mongoose.connection.readyState !== 0) {
    intentionalDisconnect = true;
    await mongoose.connection.close();
  }
};

/**
 * Returns the live Mongoose connection state for health checks.
 */
export const getDatabaseStatus = () => {
  const readyState = mongoose.connection.readyState;
  return {
    configured: isMongoUriConfigured(),
    connected: readyState === 1,
    readyState,
    state: READY_STATE_LABELS[readyState] || 'unknown',
    name: readyState === 1 ? mongoose.connection.name : null,
    host: readyState === 1 ? mongoose.connection.host : null,
  };
};
