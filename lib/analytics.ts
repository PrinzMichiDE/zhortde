import { db } from './db';
import { linkClicks } from './db/schema';
import { UAParser } from 'ua-parser-js';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

/**
 * Parse User-Agent string to extract device, browser, and OS info
 */
export function parseUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return {
      deviceType: 'unknown' as DeviceType,
      browser: 'unknown',
      os: 'unknown',
    };
  }

  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  let deviceType: DeviceType = 'desktop';
  if (device.type === 'mobile') deviceType = 'mobile';
  else if (device.type === 'tablet') deviceType = 'tablet';
  else if (device.type) deviceType = 'unknown';

  return {
    deviceType,
    browser: browser.name || 'unknown',
    os: os.name || 'unknown',
  };
}

/**
 * Get geo-location from IP address (placeholder - requires external API)
 * You can integrate with:
 * - ipapi.co (free tier: 30k requests/month)
 * - ip-api.com (free for non-commercial)
 * - MaxMind GeoLite2 (self-hosted)
 */
export async function getGeoLocation(ipAddress: string | null): Promise<{
  country: string | null;
  city: string | null;
}> {
  if (!ipAddress || ipAddress === 'unknown') {
    return { country: null, city: null };
  }

  try {
    // Example with ip-api.com (free, no auth required)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=country,city`);
    
    if (!response.ok) {
      throw new Error('Geo API failed');
    }

    const data = await response.json();
    return {
      country: data.country || null,
      city: data.city || null,
    };
  } catch (error) {
    console.error('Geo-location error:', error);
    return { country: null, city: null };
  }
}

/**
 * Track a link click with detailed analytics
 */
export async function trackLinkClick(params: {
  linkId: number;
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
}) {
  const { linkId, ipAddress, userAgent, referer } = params;

  // Parse user agent
  const { deviceType, browser, os } = parseUserAgent(userAgent);

  // Get geo-location (async, can be slow)
  const { country, city } = await getGeoLocation(ipAddress);

  // Insert click record
  await db.insert(linkClicks).values({
    linkId,
    ipAddress,
    userAgent,
    referer,
    deviceType,
    browser,
    os,
    country,
    city,
  });
}

/**
 * Get analytics for a specific link
 */
export async function getLinkAnalytics(linkId: number) {
  const clicks = await db
    .select()
    .from(linkClicks)
    .where(eq(linkClicks.linkId, linkId))
    .orderBy(desc(linkClicks.clickedAt));

  // Aggregate stats
  const totalClicks = clicks.length;
  const uniqueIps = new Set(clicks.map((c) => c.ipAddress).filter(Boolean)).size;

  const deviceBreakdown = clicks.reduce((acc, click) => {
    const device = click.deviceType || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryBreakdown = clicks.reduce((acc, click) => {
    const country = click.country || 'unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const browserBreakdown = clicks.reduce((acc, click) => {
    const browser = click.browser || 'unknown';
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalClicks,
    uniqueIps,
    deviceBreakdown,
    countryBreakdown,
    browserBreakdown,
    recentClicks: clicks.slice(0, 10), // Last 10 clicks
  };
}

// Import missing Drizzle functions
import { eq, desc } from 'drizzle-orm';

