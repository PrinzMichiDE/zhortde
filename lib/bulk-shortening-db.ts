import { db } from './db';
import { links } from './db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { monetizeUrl } from '@/lib/monetization';
import type { BulkLinkRequest } from './bulk-shortening';

export interface BulkLinkResult {
  success: boolean;
  longUrl: string;
  shortCode?: string;
  shortUrl?: string;
  linkId?: number;
  error?: string;
}

/**
 * Generate a unique short code
 */
async function generateUniqueShortCode(customCode?: string): Promise<string> {
  if (customCode) {
    const existing = await db.query.links.findFirst({
      where: eq(links.shortCode, customCode),
    });
    
    if (!existing) {
      return customCode;
    }
    return `${customCode}-${nanoid(4)}`;
  }
  
  let code: string;
  let exists = true;
  
  while (exists) {
    code = nanoid(8);
    const existing = await db.query.links.findFirst({
      where: eq(links.shortCode, code),
    });
    exists = !!existing;
  }
  
  return code!;
}

/**
 * Create a single link
 */
async function createLink(
  request: BulkLinkRequest,
  userId?: number
): Promise<BulkLinkResult> {
  try {
    const rawLongUrl = request.longUrl;

    try {
      new URL(rawLongUrl);
    } catch {
      return {
        success: false,
        longUrl: rawLongUrl,
        error: 'Invalid URL format',
      };
    }

    const longUrl = monetizeUrl(rawLongUrl);

    const shortCode = await generateUniqueShortCode(request.customCode);
    
    let expiresAt: Date | null = null;
    if (request.expiresIn && request.expiresIn !== 'never') {
      const now = new Date();
      const [value, unit] = request.expiresIn.split('-');
      const num = parseInt(value);
      
      switch (unit) {
        case 'hour':
          expiresAt = new Date(now.getTime() + num * 60 * 60 * 1000);
          break;
        case 'day':
          expiresAt = new Date(now.getTime() + num * 24 * 60 * 60 * 1000);
          break;
        case 'week':
          expiresAt = new Date(now.getTime() + num * 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          expiresAt = new Date(now.getTime() + num * 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    let passwordHash: string | null = null;
    if (request.password) {
      const bcrypt = await import('bcryptjs');
      passwordHash = await bcrypt.hash(request.password, 10);
    }

    const [newLink] = await db
      .insert(links)
      .values({
        shortCode,
        longUrl,
        userId: userId || null,
        isPublic: request.isPublic ?? (userId ? false : true),
        passwordHash,
        expiresAt,
      })
      .returning();

    return {
      success: true,
      longUrl,
      shortCode: newLink.shortCode,
      linkId: newLink.id,
      shortUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/s/${newLink.shortCode}`,
    };
  } catch (error) {
    return {
      success: false,
      longUrl: request.longUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process bulk link creation
 */
export async function processBulkLinks(
  requests: BulkLinkRequest[],
  userId?: number
): Promise<BulkLinkResult[]> {
  const results: BulkLinkResult[] = [];
  const batchSize = 10;
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(request => createLink(request, userId))
    );
    results.push(...batchResults);
  }
  
  return results;
}
