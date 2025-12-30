import { db } from './db';
import { links } from './db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export interface BulkLinkRequest {
  longUrl: string;
  customCode?: string;
  password?: string;
  expiresIn?: string;
  isPublic?: boolean;
}

export interface BulkLinkResult {
  success: boolean;
  longUrl: string;
  shortCode?: string;
  shortUrl?: string;
  error?: string;
}

/**
 * Generate a unique short code
 */
async function generateUniqueShortCode(customCode?: string): Promise<string> {
  if (customCode) {
    // Check if custom code is available
    const existing = await db.query.links.findFirst({
      where: eq(links.shortCode, customCode),
    });
    
    if (!existing) {
      return customCode;
    }
    // If custom code exists, append random suffix
    return `${customCode}-${nanoid(4)}`;
  }
  
  // Generate random code
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
    // Validate URL
    try {
      new URL(request.longUrl);
    } catch {
      return {
        success: false,
        longUrl: request.longUrl,
        error: 'Invalid URL format',
      };
    }

    const shortCode = await generateUniqueShortCode(request.customCode);
    
    // Calculate expiration
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

    // Hash password if provided
    let passwordHash: string | null = null;
    if (request.password) {
      const bcrypt = await import('bcryptjs');
      passwordHash = await bcrypt.hash(request.password, 10);
    }

    // Create link
    const [newLink] = await db
      .insert(links)
      .values({
        shortCode,
        longUrl: request.longUrl,
        userId: userId || null,
        isPublic: request.isPublic ?? (userId ? false : true),
        passwordHash,
        expiresAt,
      })
      .returning();

    return {
      success: true,
      longUrl: request.longUrl,
      shortCode: newLink.shortCode,
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
  
  // Process in batches of 10 to avoid overwhelming the database
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

/**
 * Parse CSV content
 */
export function parseCSV(csvContent: string): BulkLinkRequest[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const requests: BulkLinkRequest[] = [];
  
  // Skip header if present
  const startIndex = lines[0]?.includes('url') || lines[0]?.includes('URL') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (handles quoted values)
    const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    
    if (columns.length >= 1 && columns[0]) {
      requests.push({
        longUrl: columns[0],
        customCode: columns[1] || undefined,
        password: columns[2] || undefined,
        expiresIn: columns[3] || undefined,
        isPublic: columns[4] === 'true' || columns[4] === '1',
      });
    }
  }
  
  return requests;
}

/**
 * Parse text input (one URL per line)
 */
export function parseTextInput(textContent: string): BulkLinkRequest[] {
  const lines = textContent.split('\n').filter(line => line.trim());
  return lines.map(line => ({
    longUrl: line.trim(),
  }));
}
