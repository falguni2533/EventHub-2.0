import crypto from 'node:crypto';

/**
 * Generate an opaque, unpredictable token for QR event passes.
 * Contains zero personal information or predictable database IDs.
 */
export function generatePassToken() {
  return `evhp_${crypto.randomBytes(24).toString('base64url')}`;
}

/**
 * Generate a human-readable pass / registration reference code for display.
 * Format: PASS-YYYY-XXXXXXXX
 */
export function generatePassCode(year = new Date().getFullYear()) {
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PASS-${year}-${randomHex}`;
}
