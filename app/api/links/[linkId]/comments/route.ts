import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { links, linkComments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  requireAuth,
  validateBody,
  linkCommentSchema,
  secureResponse,
  secureErrorResponse,
  ApiErrors,
  handleApiError,
} from '@/lib/api-security';
import {
  getLinkComments,
  addLinkComment,
  deleteLinkCommentById,
} from '@/lib/link-comments';

/**
 * Shared ownership guard: the authenticated user must own the link.
 */
async function getOwnedLink(linkId: number, auth: { userId: number }) {
  const link = await db.query.links.findFirst({
    where: eq(links.id, linkId),
  });

  if (!link) {
    return { error: secureErrorResponse(ApiErrors.NOT_FOUND) };
  }

  if (link.userId !== auth.userId) {
    return { error: secureErrorResponse(ApiErrors.FORBIDDEN) };
  }

  return { link };
}

/**
 * GET /api/links/[linkId]/comments - List comments & notes for a link
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return secureErrorResponse(ApiErrors.UNAUTHORIZED);
    }

    const { linkId } = await params;
    const linkIdNum = parseInt(linkId, 10);
    if (isNaN(linkIdNum)) {
      return secureErrorResponse(ApiErrors.BAD_REQUEST);
    }

    const owned = await getOwnedLink(linkIdNum, auth);
    if (owned.error) return owned.error;

    const comments = await getLinkComments(linkIdNum);
    return secureResponse({ success: true, comments });
  } catch (error) {
    return handleApiError(error, 'comments/GET');
  }
}

/**
 * POST /api/links/[linkId]/comments - Add a comment or internal note
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return secureErrorResponse(ApiErrors.UNAUTHORIZED);
    }

    const { linkId } = await params;
    const linkIdNum = parseInt(linkId, 10);
    if (isNaN(linkIdNum)) {
      return secureErrorResponse(ApiErrors.BAD_REQUEST);
    }

    const owned = await getOwnedLink(linkIdNum, auth);
    if (owned.error) return owned.error;

    const validation = await validateBody(request, linkCommentSchema);
    if (!validation.success) {
      return secureErrorResponse(ApiErrors.VALIDATION_ERROR(validation.error));
    }

    const comment = await addLinkComment({
      linkId: linkIdNum,
      userId: auth.userId,
      content: validation.data.content.trim(),
      isInternal: validation.data.isInternal,
    });

    return secureResponse({ success: true, comment }, 201);
  } catch (error) {
    return handleApiError(error, 'comments/POST');
  }
}

/**
 * DELETE /api/links/[linkId]/comments?commentId=N
 * The link owner or the comment author may delete a comment.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return secureErrorResponse(ApiErrors.UNAUTHORIZED);
    }

    const { linkId } = await params;
    const linkIdNum = parseInt(linkId, 10);
    if (isNaN(linkIdNum)) {
      return secureErrorResponse(ApiErrors.BAD_REQUEST);
    }

    const commentId = parseInt(
      request.nextUrl.searchParams.get('commentId') || '',
      10
    );
    if (isNaN(commentId)) {
      return secureErrorResponse(ApiErrors.BAD_REQUEST);
    }

    const owned = await getOwnedLink(linkIdNum, auth);
    if (owned.error) return owned.error;

    // The link owner is always allowed; comment authors may delete their own
    const comment = await db.query.linkComments.findFirst({
      where: eq(linkComments.id, commentId),
    });
    if (!comment || comment.linkId !== linkIdNum) {
      return secureErrorResponse(ApiErrors.NOT_FOUND);
    }
    if (comment.userId !== auth.userId) {
      return secureErrorResponse(ApiErrors.FORBIDDEN);
    }

    const deleted = await deleteLinkCommentById(commentId);
    if (!deleted) {
      return secureErrorResponse(ApiErrors.NOT_FOUND);
    }

    return secureResponse({ success: true });
  } catch (error) {
    return handleApiError(error, 'comments/DELETE');
  }
}