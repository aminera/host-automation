import { randomBytes } from "crypto";

/**
 * Generate a cryptographically secure random token string.
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Return an expiry Date `hoursFromNow` hours in the future.
 */
export function getTokenExpiry(hoursFromNow = 72): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hoursFromNow);
  return expiry;
}

/**
 * Check whether a token has expired.
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
