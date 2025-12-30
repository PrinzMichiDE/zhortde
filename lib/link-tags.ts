import { db } from './db';
import { linkTags } from './db/schema';
import { eq, and } from 'drizzle-orm';

export const DEFAULT_TAG_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
];

/**
 * Get all tags for a link
 */
export async function getLinkTags(linkId: number) {
  return await db.query.linkTags.findMany({
    where: eq(linkTags.linkId, linkId),
  });
}

/**
 * Add tag to link
 */
export async function addTagToLink(
  linkId: number,
  tag: string,
  color?: string
) {
  // Check if tag already exists for this link
  const existing = await db.query.linkTags.findFirst({
    where: and(
      eq(linkTags.linkId, linkId),
      eq(linkTags.tag, tag)
    ),
  });

  if (existing) {
    return existing;
  }

  const [newTag] = await db
    .insert(linkTags)
    .values({
      linkId,
      tag,
      color: color || DEFAULT_TAG_COLORS[Math.floor(Math.random() * DEFAULT_TAG_COLORS.length)],
    })
    .returning();

  return newTag;
}

/**
 * Remove tag from link
 */
export async function removeTagFromLink(linkId: number, tagId: number) {
  await db
    .delete(linkTags)
    .where(eq(linkTags.id, tagId));
}

/**
 * Update tag color
 */
export async function updateTagColor(tagId: number, color: string) {
  const [updated] = await db
    .update(linkTags)
    .set({ color })
    .where(eq(linkTags.id, tagId))
    .returning();

  return updated;
}

/**
 * Get all unique tags for a user
 */
export async function getUserTags(userId: number) {
  // Get all links for user, then get their tags
  const userLinks = await db.query.links.findMany({
    where: eq(linkTags.linkId, userId),
  });

  // This is a simplified version - in production, use a proper join
  const allTags = await db.query.linkTags.findMany();
  
  // Filter tags for user's links
  const linkIds = userLinks.map(l => l.id);
  const userTags = allTags.filter(t => linkIds.includes(t.linkId));
  
  // Get unique tags
  const uniqueTags = new Map<string, typeof linkTags.$inferSelect>();
  userTags.forEach(tag => {
    if (!uniqueTags.has(tag.tag)) {
      uniqueTags.set(tag.tag, tag);
    }
  });

  return Array.from(uniqueTags.values());
}

/**
 * Bulk add tags to multiple links
 */
export async function bulkAddTags(linkIds: number[], tags: string[], color?: string) {
  const results = [];
  
  for (const linkId of linkIds) {
    for (const tag of tags) {
      const result = await addTagToLink(linkId, tag, color);
      results.push(result);
    }
  }
  
  return results;
}
