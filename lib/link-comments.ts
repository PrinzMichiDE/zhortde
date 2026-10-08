import { db } from './db';
import { linkComments } from './db/schema';
import { eq, desc } from 'drizzle-orm';

export type LinkComment = typeof linkComments.$inferSelect;

/**
 * List all comments/notes for a link (newest first).
 */
export async function getLinkComments(linkId: number): Promise<LinkComment[]> {
  return db.query.linkComments.findMany({
    where: eq(linkComments.linkId, linkId),
    orderBy: [desc(linkComments.createdAt)],
  });
}

export type AddCommentParams = {
  linkId: number;
  userId: number | null;
  teamId?: number;
  content: string;
  isInternal?: boolean;
};

/**
 * Add an internal note or comment to a link.
 */
export async function addLinkComment(params: AddCommentParams): Promise<LinkComment> {
  const [comment] = await db
    .insert(linkComments)
    .values({
      linkId: params.linkId,
      userId: params.userId,
      teamId: params.teamId ?? null,
      content: params.content,
      isInternal: params.isInternal ?? true,
    })
    .returning();

  return comment;
}

/**
 * Delete a comment by its id. Returns false when no row was affected.
 */
export async function deleteLinkCommentById(commentId: number): Promise<boolean> {
  const result = await db
    .delete(linkComments)
    .where(eq(linkComments.id, commentId))
    .returning({ id: linkComments.id });

  return result.length > 0;
}