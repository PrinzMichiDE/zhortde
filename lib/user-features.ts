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
 * Uses rule-based pattern matching (no AI/ML)
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
 * Smart tag generation from URL
 * Uses pattern recognition and rule-based analysis
 */
export function generateSmartTags(longUrl: string): string[] {
  const tags: string[] = [];
  
  try {
    const url = new URL(longUrl);
    const hostname = url.hostname.replace('www.', '').toLowerCase();
    const pathname = url.pathname.toLowerCase();
    const searchParams = url.searchParams;
    
    // Pattern 1: Domain analysis
    const domainParts = hostname.split('.');
    if (domainParts.length > 0) {
      const mainDomain = domainParts[0];
      // Extract meaningful domain name
      tags.push(mainDomain);
      
      // Detect domain category
      if (mainDomain.includes('github')) {
        tags.push('github', 'code', 'development', 'repository');
      } else if (mainDomain.includes('youtube') || mainDomain.includes('youtu.be')) {
        tags.push('youtube', 'video', 'media', 'entertainment');
      } else if (mainDomain.includes('twitter') || mainDomain.includes('x.com')) {
        tags.push('twitter', 'social', 'microblog', 'news');
      } else if (mainDomain.includes('linkedin')) {
        tags.push('linkedin', 'professional', 'network', 'career');
      } else if (mainDomain.includes('medium')) {
        tags.push('medium', 'article', 'blog', 'reading');
      } else if (mainDomain.includes('amazon')) {
        tags.push('amazon', 'shopping', 'ecommerce', 'product');
      } else if (mainDomain.includes('reddit')) {
        tags.push('reddit', 'discussion', 'community', 'forum');
      } else if (mainDomain.includes('instagram')) {
        tags.push('instagram', 'social', 'photo', 'visual');
      } else if (mainDomain.includes('facebook')) {
        tags.push('facebook', 'social', 'network');
      } else if (mainDomain.includes('netflix')) {
        tags.push('netflix', 'streaming', 'entertainment', 'video');
      } else if (mainDomain.includes('spotify')) {
        tags.push('spotify', 'music', 'audio', 'streaming');
      } else if (mainDomain.includes('stackoverflow') || mainDomain.includes('stackexchange')) {
        tags.push('stackoverflow', 'programming', 'qa', 'help');
      } else if (mainDomain.includes('wikipedia')) {
        tags.push('wikipedia', 'encyclopedia', 'reference', 'knowledge');
      } else if (mainDomain.includes('docs') || mainDomain.includes('documentation')) {
        tags.push('docs', 'documentation', 'reference', 'guide');
      } else if (mainDomain.includes('blog')) {
        tags.push('blog', 'article', 'writing');
      } else if (mainDomain.includes('shop') || mainDomain.includes('store')) {
        tags.push('shop', 'ecommerce', 'shopping');
      } else if (mainDomain.includes('news')) {
        tags.push('news', 'media', 'information');
      }
    }
    
    // Pattern 2: Path analysis
    const pathParts = pathname.split('/').filter(p => p.length > 0);
    for (const part of pathParts) {
      // Remove common non-semantic patterns
      const cleaned = part
        .replace(/[^a-z0-9-]/gi, '')
        .replace(/\d{4}-\d{2}-\d{2}/g, '') // Remove dates
        .replace(/^[0-9]+$/, '') // Remove pure numbers
        .replace(/^[a-z]{1,2}$/, ''); // Remove single/double letters
      
      if (cleaned.length >= 3 && cleaned.length < 20) {
        // Check if it's a meaningful word
        const meaningfulKeywords = [
          'article', 'post', 'page', 'product', 'item', 'user', 'profile',
          'category', 'tag', 'search', 'results', 'about', 'contact',
          'download', 'upload', 'file', 'image', 'video', 'audio',
          'api', 'docs', 'help', 'support', 'faq', 'guide', 'tutorial'
        ];
        
        if (meaningfulKeywords.includes(cleaned.toLowerCase())) {
          tags.push(cleaned);
        } else if (cleaned.length >= 4) {
          // Only add longer, more meaningful path parts
          tags.push(cleaned);
        }
      }
    }
    
    // Pattern 3: Query parameter analysis
    const semanticParams: Record<string, string[]> = {
      'category': ['category', 'topic', 'subject'],
      'tag': ['tag', 'label', 'keyword'],
      'type': ['type', 'kind', 'format'],
      'lang': ['language', 'locale'],
      'ref': ['referral', 'source'],
      'utm_campaign': ['campaign', 'marketing'],
      'utm_source': ['source', 'origin'],
      'utm_medium': ['medium', 'channel'],
    };
    
    for (const [param, tagVariants] of Object.entries(semanticParams)) {
      const value = searchParams.get(param);
      if (value) {
        tags.push(...tagVariants);
        const cleanedValue = value.replace(/[^a-z0-9-]/gi, '').toLowerCase();
        if (cleanedValue.length >= 3 && cleanedValue.length < 15) {
          tags.push(cleanedValue);
        }
      }
    }
    
    // Pattern 4: File extension detection
    const fileExtension = pathname.match(/\.([a-z0-9]+)$/i)?.[1];
    if (fileExtension) {
      const extensionTags: Record<string, string[]> = {
        'pdf': ['pdf', 'document'],
        'jpg': ['image', 'photo'],
        'jpeg': ['image', 'photo'],
        'png': ['image', 'photo'],
        'gif': ['image', 'animation'],
        'mp4': ['video'],
        'mp3': ['audio', 'music'],
        'zip': ['archive', 'download'],
        'doc': ['document', 'word'],
        'xls': ['spreadsheet', 'excel'],
      };
      
      if (extensionTags[fileExtension.toLowerCase()]) {
        tags.push(...extensionTags[fileExtension.toLowerCase()]);
      }
    }
    
    // Pattern 5: URL structure analysis
    if (pathname.includes('/api/')) tags.push('api', 'endpoint');
    if (pathname.includes('/admin/')) tags.push('admin', 'management');
    if (pathname.includes('/dashboard/')) tags.push('dashboard', 'control');
    if (pathname.includes('/search')) tags.push('search', 'query');
    if (pathname.includes('/login') || pathname.includes('/signin')) tags.push('auth', 'login');
    if (pathname.includes('/register') || pathname.includes('/signup')) tags.push('auth', 'register');
    
  } catch {
    // Return empty array on error
  }
  
  return [...new Set(tags)].slice(0, 8); // Return unique tags, max 8
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
