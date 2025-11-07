import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, smartRedirects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/links/[linkId]/redirects/reorder - Reorder redirect rules
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { linkId } = await params;
    const linkIdNum = parseInt(linkId, 10);

    if (isNaN(linkIdNum)) {
      return NextResponse.json({ error: 'Invalid Link ID' }, { status: 400 });
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

    const body = await request.json();
    const { order } = body; // Array of redirect IDs in new order

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: 'Order must be an array' },
        { status: 400 }
      );
    }

    // Update priorities
    for (let i = 0; i < order.length; i++) {
      await db
        .update(smartRedirects)
        .set({ priority: i })
        .where(eq(smartRedirects.id, order[i]));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redirect reorder error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder redirects' },
      { status: 500 }
    );
  }
}

