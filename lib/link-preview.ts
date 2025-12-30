import { db } from './db';
import { linkPreviews } from './db/schema';
import { eq } from 'drizzle-orm';

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
  type?: string;
  favicon?: string;
}

/**
 * Fetch Open Graph data from a URL
 */
export async function fetchOpenGraphData(url: string): Promise<OpenGraphData | null> {
  try {
    // Use a simple fetch approach - in production, consider using a headless browser
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZhortBot/1.0; +https://zhort.de)',
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // Simple regex-based OG tag extraction
    // In production, consider using a proper HTML parser
    const ogData: OpenGraphData = {};
    
    // Extract title
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) ogData.title = titleMatch[1];

    // Extract description
    const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                       html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) ogData.description = descMatch[1];

    // Extract image
    const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (imageMatch) {
      ogData.image = imageMatch[1].startsWith('http') 
        ? imageMatch[1] 
        : new URL(imageMatch[1], url).toString();
    }

    // Extract site name
    const siteMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
    if (siteMatch) ogData.siteName = siteMatch[1];

    // Extract URL
    const urlMatch = html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i);
    if (urlMatch) ogData.url = urlMatch[1];

    // Extract favicon
    const faviconMatch = html.match(/<link\s+rel=["'](?:shortcut\s+)?icon["']\s+href=["']([^"']+)["']/i);
    if (faviconMatch) {
      ogData.favicon = faviconMatch[1].startsWith('http')
        ? faviconMatch[1]
        : new URL(faviconMatch[1], url).toString();
    }

    return Object.keys(ogData).length > 0 ? ogData : null;
  } catch (error) {
    console.error('Error fetching Open Graph data:', error);
    return null;
  }
}

/**
 * Generate thumbnail URL using a screenshot service
 * In production, integrate with screenshotapi.net, urlbox.io, or similar
 */
export async function generateThumbnailUrl(url: string): Promise<string | null> {
  // For now, return null - integrate with screenshot service
  // Example: return `https://api.screenshotapi.net/v1/screenshot?url=${encodeURIComponent(url)}&width=1200&height=630`;
  return null;
}

/**
 * Get or create link preview
 */
export async function getLinkPreview(linkId: number, longUrl: string): Promise<typeof linkPreviews.$inferSelect | null> {
  try {
    // Check cache first
    const cached = await db.query.linkPreviews.findFirst({
      where: eq(linkPreviews.linkId, linkId),
    });

    // Return cached if less than 24 hours old
    if (cached) {
      const age = Date.now() - cached.lastFetched.getTime();
      if (age < 24 * 60 * 60 * 1000) {
        return cached;
      }
    }

    // Fetch fresh data
    const ogData = await fetchOpenGraphData(longUrl);
    if (!ogData) {
      return cached || null; // Return cached if fetch fails
    }

    const thumbnailUrl = await generateThumbnailUrl(longUrl);

    const previewData = {
      linkId,
      title: ogData.title || null,
      description: ogData.description || null,
      imageUrl: ogData.image || null,
      thumbnailUrl: thumbnailUrl || ogData.image || null,
      siteName: ogData.siteName || null,
      faviconUrl: ogData.favicon || null,
      ogData: JSON.stringify(ogData),
      lastFetched: new Date(),
    };

    if (cached) {
      // Update existing
      const [updated] = await db
        .update(linkPreviews)
        .set(previewData)
        .where(eq(linkPreviews.id, cached.id))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(linkPreviews)
        .values(previewData)
        .returning();
      return created;
    }
  } catch (error) {
    console.error('Error getting link preview:', error);
    return null;
  }
}

/**
 * Batch fetch previews for multiple links
 */
export async function batchGetLinkPreviews(
  links: Array<{ id: number; longUrl: string }>
): Promise<Map<number, typeof linkPreviews.$inferSelect | null>> {
  const results = new Map<number, typeof linkPreviews.$inferSelect | null>();
  
  // Process in batches to avoid overwhelming
  const batchSize = 5;
  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (link) => {
        const preview = await getLinkPreview(link.id, link.longUrl);
        results.set(link.id, preview);
      })
    );
  }
  
  return results;
}
