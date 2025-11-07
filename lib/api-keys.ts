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
 * Create a new API key for a user
 */
export async function createApiKey(userId: number, name: string) {
  const { key, prefix } = generateApiKey();
  const keyHash = await hashApiKey(key);

  const [apiKey] = await db.insert(apiKeys).values({
    userId,
    name,
    keyHash,
    keyPrefix: prefix,
  }).returning();

  // Return the plain key ONCE (user must save it)
  return {
    id: apiKey.id,
    key, // Plain text (only shown once!)
    prefix,
    name,
    createdAt: apiKey.createdAt,
  };
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

