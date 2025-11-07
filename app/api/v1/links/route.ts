import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateApiKey } from '@/lib/api-keys';
import { nanoid } from 'nanoid';

/**
 * API v1 - Create Link
 * POST /api/v1/links
 * Headers: Authorization: Bearer zhort_xxxxx
 */
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { longUrl, customCode, password, expiresIn } = body;

    if (!longUrl) {
      return NextResponse.json(
        { error: 'longUrl is required' },
        { status: 400 }
      );
    }

    // Generate or validate custom code
    const shortCode = customCode || nanoid(8);

    // Check if code exists
    const existing = await db.query.links.findFirst({
      where: eq(links.shortCode, shortCode),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Short code already exists' },
        { status: 409 }
      );
    }

    // Calculate expiration
    let expiresAt = null;
    if (expiresIn) {
      const now = new Date();
      switch (expiresIn) {
        case '1h':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case '24h':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '7d':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Create link
    const [link] = await db.insert(links).values({
      shortCode,
      longUrl,
      userId,
      isPublic: true,
      expiresAt,
    }).returning();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zhort.app';
    const shortUrl = `${baseUrl}/s/${link.shortCode}`;

    return NextResponse.json({
      id: link.id,
      shortCode: link.shortCode,
      shortUrl,
      longUrl: link.longUrl,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API v1 - List Links
 * GET /api/v1/links
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get user's links
    const userLinks = await db
      .select()
      .from(links)
      .where(eq(links.userId, userId))
      .limit(100);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zhort.app';

    return NextResponse.json({
      links: userLinks.map((link) => ({
        id: link.id,
        shortCode: link.shortCode,
        shortUrl: `${baseUrl}/s/${link.shortCode}`,
        longUrl: link.longUrl,
        hits: link.hits,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
      })),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

