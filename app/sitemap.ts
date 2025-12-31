import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/env';
import { db } from '@/lib/db';
import { bioProfiles } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/api`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/paste/create`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: `${baseUrl}/datenschutz`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // Include public link-in-bio profiles (high-signal, user-facing pages)
  try {
    const profiles = await db
      .select({
        username: bioProfiles.username,
        updatedAt: bioProfiles.updatedAt,
      })
      .from(bioProfiles)
      .where(eq(bioProfiles.isActive, true))
      .orderBy(desc(bioProfiles.updatedAt))
      .limit(5000);

    const profileUrls: MetadataRoute.Sitemap = profiles.map((p) => ({
      url: `${baseUrl}/bio/${encodeURIComponent(p.username)}`,
      lastModified: p.updatedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.35,
    }));

    return [...staticUrls, ...profileUrls];
  } catch {
    // If DB is unavailable (e.g. local build without DB), still serve static URLs.
    return staticUrls;
  }
}

