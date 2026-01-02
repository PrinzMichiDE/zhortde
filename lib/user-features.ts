import { db } from './db';
import { 
  links, 
  linkCollections, 
  linkHealthChecks,
  quickActions
} from './db/schema';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * User Features Library
 * Innovative features for regular users
 */

/**
 * Generate smart short code suggestions based on URL
 */
export function generateSmartShortCodeSuggestions(longUrl: string): string[] {
  const suggestions: string[] = [];
  
  try {
    const url = new URL(longUrl);
    const hostname = url.hostname.replace('www.', '');
    
    // Extract domain keywords
    const domainParts = hostname.split('.');
    if (domainParts.length > 0) {
      const mainDomain = domainParts[0];
      if (mainDomain.length <= 8) {
        suggestions.push(mainDomain);
      }
    }
    
    // Extract path keywords
    const pathParts = url.pathname.split('/').filter(p => p.length > 0);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.length <= 10 && /^[a-zA-Z0-9-]+$/.test(lastPart)) {
        suggestions.push(lastPart.substring(0, 8));
      }
    }
    
    // Generate from URL hash
    const hash = longUrl.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const hashStr = Math.abs(hash).toString(36).substring(0, 6);
    suggestions.push(hashStr);
    
    // Generate random short codes
    const random1 = Math.random().toString(36).substring(2, 8);
    const random2 = Math.random().toString(36).substring(2, 8);
    suggestions.push(random1, random2);
    
  } catch {
    // Fallback to random suggestions
    suggestions.push(
      Math.random().toString(36).substring(2, 8),
      Math.random().toString(36).substring(2, 8),
      Math.random().toString(36).substring(2, 8)
    );
  }
  
  return [...new Set(suggestions)].slice(0, 5); // Return unique suggestions, max 5
}

/**
 * Generate smart tags from URL
 */
export function generateSmartTags(longUrl: string): string[] {
  const tags: string[] = [];
  
  try {
    const url = new URL(longUrl);
    
    // Domain-based tags
    const hostname = url.hostname.replace('www.', '');
    const domainParts = hostname.split('.');
    if (domainParts.length > 0) {
      tags.push(domainParts[0]);
    }
    
    // Path-based tags
    const pathParts = url.pathname.split('/').filter(p => p.length > 0);
    pathParts.forEach(part => {
      if (part.length > 2 && part.length < 20 && /^[a-zA-Z0-9-]+$/.test(part)) {
        tags.push(part);
      }
    });
    
    // Common domain patterns
    if (hostname.includes('github')) tags.push('github', 'code');
    if (hostname.includes('youtube')) tags.push('youtube', 'video');
    if (hostname.includes('twitter') || hostname.includes('x.com')) tags.push('twitter', 'social');
    if (hostname.includes('linkedin')) tags.push('linkedin', 'professional');
    if (hostname.includes('medium')) tags.push('medium', 'article');
    if (hostname.includes('amazon')) tags.push('amazon', 'shopping');
    
  } catch {
    // Return empty array on error
  }
  
  return [...new Set(tags)].slice(0, 5); // Return unique tags, max 5
}

/**
 * Check link health (if URL is accessible)
 */
export async function checkLinkHealth(linkId: number): Promise<{
  status: 'healthy' | 'broken' | 'redirecting' | 'timeout' | 'ssl_error' | 'unknown';
  statusCode?: number;
  responseTime?: number;
  errorMessage?: string;
}> {
  const link = await db.query.links.findFirst({
    where: eq(links.id, linkId),
  });

  if (!link) {
    return { status: 'unknown' };
  }

  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(link.longUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    
    // Log health check
    await db.insert(linkHealthChecks).values({
      linkId,
      status: statusCode >= 200 && statusCode < 400 ? 'healthy' : 'broken',
      statusCode,
      responseTime,
    });
    
    // Update link health status
    await db.update(links)
      .set({
        healthStatus: statusCode >= 200 && statusCode < 400 ? 'healthy' : 'broken',
        lastHealthCheck: new Date(),
      })
      .where(eq(links.id, linkId));
    
    if (statusCode >= 300 && statusCode < 400) {
      return { status: 'redirecting', statusCode, responseTime };
    }
    
    if (statusCode >= 200 && statusCode < 300) {
      return { status: 'healthy', statusCode, responseTime };
    }
    
    return { status: 'broken', statusCode, responseTime };
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    let status: 'timeout' | 'ssl_error' | 'broken' | 'unknown' = 'unknown';
    let errorMessage = error.message;
    
    if (error.name === 'AbortError') {
      status = 'timeout';
      errorMessage = 'Request timeout';
    } else if (error.message?.includes('SSL') || error.message?.includes('certificate')) {
      status = 'ssl_error';
    } else {
      status = 'broken';
    }
    
    // Log health check
    await db.insert(linkHealthChecks).values({
      linkId,
      status,
      errorMessage,
      responseTime,
    });
    
    // Update link health status
    await db.update(links)
      .set({
        healthStatus: status,
        lastHealthCheck: new Date(),
      })
      .where(eq(links.id, linkId));
    
    return { status, errorMessage, responseTime };
  }
}

/**
 * Create link collection
 */
export async function createLinkCollection(params: {
  userId: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}) {
  const { userId, name, description, color, icon } = params;

  const collection = await db.insert(linkCollections).values({
    userId,
    name,
    description: description || null,
    color: color || null,
    icon: icon || null,
    isDefault: false,
    linkCount: 0,
  }).returning();

  return collection[0];
}

/**
 * Add link to collection
 */
export async function addLinkToCollection(linkId: number, collectionId: number) {
  const link = await db.query.links.findFirst({
    where: eq(links.id, linkId),
  });

  if (!link) {
    throw new Error('Link not found');
  }

  // Update link
  await db.update(links)
    .set({ collectionId })
    .where(eq(links.id, linkId));

  // Update collection count
  await db.update(linkCollections)
    .set({ linkCount: sql`${linkCollections.linkCount} + 1` })
    .where(eq(linkCollections.id, collectionId));
}

/**
 * Remove link from collection
 */
export async function removeLinkFromCollection(linkId: number) {
  const link = await db.query.links.findFirst({
    where: eq(links.id, linkId),
  });

  if (!link || !link.collectionId) {
    return;
  }

  const collectionId = link.collectionId;

  // Update link
  await db.update(links)
    .set({ collectionId: null })
    .where(eq(links.id, linkId));

  // Update collection count
  await db.update(linkCollections)
    .set({ linkCount: sql`${linkCollections.linkCount} - 1` })
    .where(eq(linkCollections.id, collectionId));
}

/**
 * Log quick action
 */
export async function logQuickAction(params: {
  userId?: number;
  linkId?: number;
  actionType: 'copy' | 'share' | 'qr' | 'analytics' | 'edit';
  metadata?: Record<string, any>;
}) {
  const { userId, linkId, actionType, metadata } = params;

  await db.insert(quickActions).values({
    userId: userId || null,
    linkId: linkId || null,
    actionType,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

/**
 * Get user's most used quick actions
 */
export async function getMostUsedActions(userId: number, limit: number = 5) {
  const actions = await db
    .select({
      actionType: quickActions.actionType,
      count: sql<number>`count(*)::int`,
    })
    .from(quickActions)
    .where(eq(quickActions.userId, userId))
    .groupBy(quickActions.actionType)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return actions;
}

/**
 * Check if link needs expiration reminder
 */
export async function checkExpirationReminders(userId: number) {
  const now = new Date();
  const reminderDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  const linksNeedingReminder = await db.query.links.findMany({
    where: eq(links.userId, userId),
  });

  const reminders: Array<{ linkId: number; shortCode: string; expiresAt: Date }> = [];

  for (const link of linksNeedingReminder) {
    if (link.expiresAt && !link.expirationReminderSent) {
      const expiresAt = new Date(link.expiresAt);
      if (expiresAt <= reminderDate && expiresAt > now) {
        reminders.push({
          linkId: link.id,
          shortCode: link.shortCode,
          expiresAt,
        });
      }
    }
  }

  return reminders;
}

/**
 * Mark expiration reminder as sent
 */
export async function markExpirationReminderSent(linkId: number) {
  await db.update(links)
    .set({ expirationReminderSent: true })
    .where(eq(links.id, linkId));
}
