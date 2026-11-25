import crypto from 'node:crypto';

/**
 * Generate a secure, human-readable certificate ID.
 * Format: EVH-YYYY-XXXXXXXX (e.g. EVH-2026-A7F39C2B)
 */
export function generateCertificateId(year = new Date().getFullYear()) {
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EVH-${year}-${randomHex}`;
}
