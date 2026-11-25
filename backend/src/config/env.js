import dotenv from 'dotenv';

dotenv.config();

const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: (process.env.MONGODB_URI || '').trim(),
  mongoDbName: 'eventhub',
  jwtSecret: (process.env.JWT_SECRET || '').trim(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminSetupKey: (process.env.ADMIN_SETUP_KEY || '').trim(),
};

const PLACEHOLDER_MARKERS = [
  '<username>',
  '<password>',
  '<db_password>',
  '<cluster-url>',
];

/**
 * Checks whether MONGODB_URI has a valid MongoDB scheme and no placeholder tokens.
 */
export const isMongoUriConfigured = () => {
  if (!env.mongoUri) return false;
  const hasValidScheme =
    env.mongoUri.startsWith('mongodb+srv://') ||
    env.mongoUri.startsWith('mongodb://');
  if (!hasValidScheme) return false;
  return !PLACEHOLDER_MARKERS.some((marker) => env.mongoUri.includes(marker));
};

/**
 * Validates critical server environment variables before booting Express or MongoDB.
 */
export const validateEnv = () => {
  const errors = [];

  if (!env.mongoUri) {
    errors.push('MONGODB_URI is missing in backend/.env');
  } else if (!isMongoUriConfigured()) {
    errors.push(
      'MONGODB_URI in backend/.env is malformed or still contains placeholder values (must start with mongodb+srv:// or mongodb://)'
    );
  }

  if (!env.jwtSecret) {
    errors.push('JWT_SECRET is missing in backend/.env');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n - ${errors.join('\n - ')}`);
  }
};
