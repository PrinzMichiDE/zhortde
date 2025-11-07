import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, smartRedirects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/links/[linkId]/redirects - Get all redirect rules for a link
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

    // Get redirects
    const redirects = await db
      .select()
      .from(smartRedirects)
      .where(eq(smartRedirects.linkId, linkIdNum))
      .orderBy(smartRedirects.priority);

    return NextResponse.json({ redirects });
  } catch (error) {
    console.error('Redirects GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redirects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/links/[linkId]/redirects - Create a new redirect rule
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
    const { ruleType, condition, targetUrl } = body;

    if (!ruleType || !condition || !targetUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current max priority
    const existingRedirects = await db
      .select()
      .from(smartRedirects)
      .where(eq(smartRedirects.linkId, linkIdNum));

    const maxPriority = existingRedirects.length > 0
      ? Math.max(...existingRedirects.map((r) => r.priority))
      : -1;

    // Create redirect
    const [redirect] = await db
      .insert(smartRedirects)
      .values({
        linkId: linkIdNum,
        ruleType,
        condition,
        targetUrl,
        priority: maxPriority + 1,
      })
      .returning();

    return NextResponse.json({ redirect }, { status: 201 });
  } catch (error) {
    console.error('Redirects POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create redirect' },
      { status: 500 }
    );
  }
}

