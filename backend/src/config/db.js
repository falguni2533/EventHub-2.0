import mongoose from 'mongoose';
import { env, isMongoUriConfigured } from './env.js';

const READY_STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let listenersRegistered = false;
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

  if (!isMongoUriConfigured()) {
    throw new Error(
      'MONGODB_URI is missing, malformed, or still contains placeholders in backend/.env'
    );
  }

  console.log(`[MongoDB] Connecting to Atlas database "${env.mongoDbName}"...`);

  activeConnectionPromise = mongoose
    .connect(env.mongoUri, {
      dbName: env.mongoDbName,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    .catch((error) => {
      activeConnectionPromise = null;
      throw error;
    });

  const conn = await activeConnectionPromise;
  activeConnectionPromise = null;
  return conn;
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
