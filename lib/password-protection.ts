import bcrypt from 'bcryptjs';

/**
 * Hash a password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Calculate expiration date based on duration string
 */
export function calculateExpiration(duration: string): Date | null {
  const now = new Date();
  
  switch (duration) {
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case 'never':
      return null;
    default:
      return null;
  }
}

/**
 * Check if a resource has expired
 */
export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

/**
 * Get expiration options for UI
 */
export const EXPIRATION_OPTIONS = [
  { value: 'never', labelKey: 'never' },
  { value: '1h', labelKey: '1hour' },
  { value: '24h', labelKey: '1day' },
  { value: '7d', labelKey: '7days' },
  { value: '30d', labelKey: '30days' },
  { value: '90d', labelKey: '90days' },
  { value: '1y', labelKey: '1year' },
] as const;

export type ExpirationDuration = typeof EXPIRATION_OPTIONS[number]['value'];

