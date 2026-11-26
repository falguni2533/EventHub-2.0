import mongoose from 'mongoose';
import { env, isMongoUriConfigured, redactMongoCredentials } from './env.js';

const READY_STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const RECONNECT_BASE_DELAY_MS = 2000;
const RECONNECT_MAX_DELAY_MS = 30000;

let listenersRegistered = false;
let usingMemoryServer = false;
let memoryServerInstance = null;
let activeConnectionPromise = null;
let intentionalDisconnect = false;
let hasConnectedOnce = false;
let reconnectTimer = null;
let reconnectAttempt = 0;

// Fail fast instead of buffering Mongoose queries for 10 seconds if disconnected
mongoose.set('bufferCommands', false);

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const scheduleReconnect = () => {
  if (
    intentionalDisconnect ||
    reconnectTimer ||
    activeConnectionPromise ||
    mongoose.connection.readyState !== 0
  ) {
    return;
  }

  const delayMs = Math.min(
    RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt,
    RECONNECT_MAX_DELAY_MS
  );
  reconnectAttempt += 1;

  console.warn(
    `[MongoDB] Scheduling reconnect attempt #${reconnectAttempt} in ${Math.round(
      delayMs / 1000
    )}s...`
  );

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (
      intentionalDisconnect ||
      mongoose.connection.readyState === 1 ||
      mongoose.connection.readyState === 2
    ) {
      return;
    }

    try {
      await connectDatabase();
    } catch (error) {
      console.error(
        `[MongoDB] Reconnect attempt #${reconnectAttempt} failed:`,
        redactMongoCredentials(error?.message || 'Unknown connection error')
      );
      scheduleReconnect();
    }
  }, delayMs);

  reconnectTimer.unref?.();
};

const registerConnectionListeners = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    intentionalDisconnect = false;
    hasConnectedOnce = true;
    reconnectAttempt = 0;
    clearReconnectTimer();
    console.log(
      `[MongoDB] Connected to database "${mongoose.connection.name}" on host "${mongoose.connection.host}"`
    );
  });

  mongoose.connection.on('reconnected', () => {
    hasConnectedOnce = true;
    reconnectAttempt = 0;
    clearReconnectTimer();
    console.log(
      `[MongoDB] Reconnected to database "${mongoose.connection.name}"`
    );
  });

  mongoose.connection.on('error', (err) => {
    console.error(
      '[MongoDB] Connection error:',
      redactMongoCredentials(err?.message || 'Unknown error')
    );
  });

  mongoose.connection.on('disconnected', () => {
    if (intentionalDisconnect) {
      console.log('[MongoDB] Connection closed cleanly');
      return;
    }

    if (hasConnectedOnce) {
      hasConnectedOnce = false;
      console.warn('[MongoDB] Unexpectedly disconnected from MongoDB Atlas');
      scheduleReconnect();
    }
  });
};

/**
 * Identifies configuration or authentication errors that should not be retried blindly.
 */
export const isNonRetryableMongoError = (error) => {
  if (!isMongoUriConfigured()) return true;
  if (!error) return false;
  if (error.code === 18 || error.code === 8000) return true;
  if (error.codeName === 'AuthenticationFailed') return true;
  if (error.name === 'MongoParseError') return true;
  const msg = String(error.message || '');
  return /authentication failed|bad auth|missing|malformed|invalid scheme/i.test(msg);
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

  intentionalDisconnect = false;
  clearReconnectTimer();
  console.log(`[MongoDB] Connecting to Atlas database "${env.mongoDbName}"...`);

  activeConnectionPromise = mongoose
    .connect(env.mongoUri, {
      dbName: env.mongoDbName,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      family: 4,
    })
    .catch((error) => {
      activeConnectionPromise = null;
      error.message = redactMongoCredentials(error.message);
      throw error;
    });

  const conn = await activeConnectionPromise;
  activeConnectionPromise = null;
  console.log('[MongoDB] In‑memory server ready.');
  return memConn;
};

/**
 * Gracefully closes the Mongoose connection.
 */
export const disconnectDatabase = async () => {
  intentionalDisconnect = true;
  hasConnectedOnce = false;
  clearReconnectTimer();
  activeConnectionPromise = null;
  if (mongoose.connection.readyState !== 0) {
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
