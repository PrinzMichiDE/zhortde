import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { apiKeys } from './db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a new API key (format: zhort_xxxxxxxxxxxxxxxxxxxxx)
 */
export function generateApiKey(): { key: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const key = `zhort_${randomBytes}`;
  const prefix = key.substring(0, 13); // "zhort_" + first 7 chars

  return { key, prefix };
}

/**
 * Hash an API key for secure storage
 */
export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10);
}

/**
 * Verify an API key against stored hash
 */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

/**
 * Map an expiresIn selector to an absolute expiry date.
 * Kept pure so the mapping is unit-testable.
 */
export function calculateApiKeyExpiry(
  expiresIn: '30d' | '90d' | '365d' | 'never' | undefined,
  now: Date = new Date()
): Date | null {
  if (!expiresIn || expiresIn === 'never') {
    return null;
  }

  const days: Record<'30d' | '90d' | '365d', number> = {
    '30d': 30,
    '90d': 90,
    '365d': 365,
  };

  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + days[expiresIn]);
  return expiry;
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  userId: number,
  name: string,
  expiresIn?: '30d' | '90d' | '365d' | 'never'
) {
  const { key, prefix } = generateApiKey();
  const keyHash = await hashApiKey(key);
  const expiresAt = calculateApiKeyExpiry(expiresIn);

  const [apiKey] = await db.insert(apiKeys).values({
    userId,
    name,
    keyHash,
    keyPrefix: prefix,
    expiresAt,
  }).returning();

  // Return the plain key ONCE (user must save it)
  return {
    id: apiKey.id,
    key, // Plain text (only shown once!)
    prefix,
    name,
    createdAt: apiKey.createdAt,
    expiresAt,
  };
}

/**
 * Rotate an API key: replaces the stored hash/prefix with a brand-new key
 * while keeping the same id. Returns the new plain-text key (shown once).
 */
export async function rotateApiKey(
  apiKeyId: number,
  userId: number
): Promise<{ key: string; prefix: string } | null> {
  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, apiKeyId),
  });

  if (!apiKey || apiKey.userId !== userId) {
    return null;
  }

  const { key, prefix } = generateApiKey();
  const keyHash = await hashApiKey(key);

  await db
    .update(apiKeys)
    .set({ keyHash, keyPrefix: prefix, lastUsedAt: null })
    .where(eq(apiKeys.id, apiKeyId));

  return { key, prefix };
}

/**
 * Validate an API key and return the user ID
 */
export async function validateApiKey(key: string): Promise<number | null> {
  if (!key.startsWith('zhort_')) {
    return null;
  }

  const prefix = key.substring(0, 13);

  // Find key by prefix
  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyPrefix, prefix),
  });

  if (!apiKey) {
    return null;
  }

  // Check if expired
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return null;
  }

  // Verify hash
  const isValid = await verifyApiKey(key, apiKey.keyHash);
  if (!isValid) {
    return null;
  }

  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return apiKey.userId;
}

