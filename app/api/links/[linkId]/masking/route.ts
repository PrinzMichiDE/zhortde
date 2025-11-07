import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, linkMasking } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/links/[linkId]/masking - Get masking config for a link
 */
export async function GET(
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

    // Get masking config
    const masking = await db.query.linkMasking.findFirst({
      where: eq(linkMasking.linkId, linkIdNum),
    });

    return NextResponse.json({ masking: masking || null });
  } catch (error) {
    console.error('Masking GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch masking config' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/links/[linkId]/masking - Create or update masking config
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
    const { enableFrame, enableSplash, splashDurationMs, splashHtml } = body;

    // Check if masking config exists
    const existingMasking = await db.query.linkMasking.findFirst({
      where: eq(linkMasking.linkId, linkIdNum),
    });

    let masking;

    if (existingMasking) {
      // Update existing
      [masking] = await db
        .update(linkMasking)
        .set({
          enableFrame: enableFrame ?? false,
          enableSplash: enableSplash ?? false,
          splashDurationMs: splashDurationMs ?? 3000,
          splashHtml: splashHtml ?? null,
        })
        .where(eq(linkMasking.linkId, linkIdNum))
        .returning();
    } else {
      // Create new
      [masking] = await db
        .insert(linkMasking)
        .values({
          linkId: linkIdNum,
          enableFrame: enableFrame ?? false,
          enableSplash: enableSplash ?? false,
          splashDurationMs: splashDurationMs ?? 3000,
          splashHtml: splashHtml ?? null,
        })
        .returning();
    }

    return NextResponse.json({ masking });
  } catch (error) {
    console.error('Masking POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save masking config' },
      { status: 500 }
    );
  }
}

