import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, smartRedirects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * DELETE /api/links/[linkId]/redirects/[redirectId] - Delete a redirect rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string; redirectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { linkId, redirectId } = await params;
    const linkIdNum = parseInt(linkId, 10);
    const redirectIdNum = parseInt(redirectId, 10);

    if (isNaN(linkIdNum) || isNaN(redirectIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verify link ownership
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    if (link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete redirect
    const result = await db
      .delete(smartRedirects)
      .where(
        and(
          eq(smartRedirects.id, redirectIdNum),
          eq(smartRedirects.linkId, linkIdNum)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Redirect not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redirect DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete redirect' },
      { status: 500 }
    );
  }
}

