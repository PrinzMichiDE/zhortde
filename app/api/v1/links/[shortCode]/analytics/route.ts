import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateApiKey } from '@/lib/api-keys';
import { getLinkAnalytics } from '@/lib/analytics';

/**
 * API v1 - Get link analytics
 * GET /api/v1/links/:shortCode/analytics
 * Headers: Authorization: Bearer zhort_xxxxx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    // Validate API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const userId = await validateApiKey(apiKey);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Find the link and enforce ownership
    const link = await db.query.links.findFirst({
      where: eq(links.shortCode, shortCode),
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    if (link.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const analytics = await getLinkAnalytics(link.id);

    return NextResponse.json({
      success: true,
      shortCode: link.shortCode,
      longUrl: link.longUrl,
      ...analytics,
    });
  } catch (error) {
    console.error('V1 analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}