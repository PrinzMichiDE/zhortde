import { db } from './db';
import { links, linkTags } from './db/schema';
import { eq, and, inArray } from 'drizzle-orm';

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
 * Get all unique tags for a user across their links.
 */
export async function getUserTags(userId: number) {
  const rows = await db
    .select({
      id: linkTags.id,
      tag: linkTags.tag,
      color: linkTags.color,
    })
    .from(linkTags)
    .where(eq(linkTags.userId, userId));

  // De-duplicate by tag name, keeping the first occurrence
  const uniqueTags = new Map<string, { id: number; tag: string; color: string | null }>();
  rows.forEach((row: { id: number; tag: string; color: string | null }) => {
    if (!uniqueTags.has(row.tag)) {
      uniqueTags.set(row.tag, row);
    }
  });

  return Array.from(uniqueTags.values());
}

/**
 * Get the tags for a set of links (for the dashboard list).
 * Returns a map of linkId -> tags so the client can filter by tag.
 */
export async function getTagsForLinks(linkIds: number[]) {
  if (linkIds.length === 0) {
    return new Map<number, Array<{ id: number; tag: string; color: string | null }>>();
  }

  const rows = await db
    .select({
      id: linkTags.id,
      linkId: linkTags.linkId,
      tag: linkTags.tag,
      color: linkTags.color,
    })
    .from(linkTags)
    .where(inArray(linkTags.linkId, linkIds));

  const map = new Map<number, Array<{ id: number; tag: string; color: string | null }>>();
  for (const row of rows) {
    const list = map.get(row.linkId) ?? [];
    list.push({ id: row.id, tag: row.tag, color: row.color });
    map.set(row.linkId, list);
  }

  return map;
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
