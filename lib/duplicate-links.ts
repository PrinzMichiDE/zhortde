import { db } from './db';
import { links } from './db/schema';
import { and, eq } from 'drizzle-orm';

export type DuplicateLink = {
  id: number;
  shortCode: string;
  longUrl: string;
};

/**
 * Find an existing link that already contains the exact same long URL for
 * the same user. Used to warn authenticated users that they are creating a
 * duplicate short link instead of silently creating another one.
 */
export async function findDuplicateLink(
  userId: number,
  longUrl: string
): Promise<DuplicateLink | null> {
  const existing = await db.query.links.findFirst({
    where: and(
      eq(links.userId, userId),
      eq(links.longUrl, longUrl)
    ),
    columns: {
      id: true,
      shortCode: true,
      longUrl: true,
    },
  });

  if (!existing) {
    return null;
  }

  return existing;
}