import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, linkClicks } from '@/lib/db/schema';
import { eq, sql, countDistinct, desc } from 'drizzle-orm';

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

    // Get link
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Verify ownership
    if (link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Total clicks
    const totalClicksResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum));
    const totalClicks = totalClicksResult[0]?.count || 0;

    // Unique IPs
    const uniqueIpsResult = await db
      .select({ count: countDistinct(linkClicks.ipAddress) })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum));
    const uniqueIps = uniqueIpsResult[0]?.count || 0;

    // Device breakdown
    const deviceBreakdownResult = await db
      .select({
        deviceType: linkClicks.deviceType,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(linkClicks.deviceType);

    const deviceBreakdown: Record<string, number> = {};
    deviceBreakdownResult.forEach((row) => {
      if (row.deviceType) {
        deviceBreakdown[row.deviceType] = row.count;
      }
    });

    // Country breakdown
    const countryBreakdownResult = await db
      .select({
        country: linkClicks.country,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(linkClicks.country);

    const countryBreakdown: Record<string, number> = {};
    countryBreakdownResult.forEach((row) => {
      if (row.country) {
        countryBreakdown[row.country] = row.count;
      }
    });

    // Browser breakdown
    const browserBreakdownResult = await db
      .select({
        browser: linkClicks.browser,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(linkClicks.browser);

    const browserBreakdown: Record<string, number> = {};
    browserBreakdownResult.forEach((row) => {
      if (row.browser) {
        browserBreakdown[row.browser] = row.count;
      }
    });

    // OS breakdown
    const osBreakdownResult = await db
      .select({
        os: linkClicks.os,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(linkClicks.os);

    const osBreakdown: Record<string, number> = {};
    osBreakdownResult.forEach((row) => {
      if (row.os) {
        osBreakdown[row.os] = row.count;
      }
    });

    // Referrer breakdown
    const referrerBreakdownResult = await db
      .select({
        referer: linkClicks.referer,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(linkClicks.referer);

    const referrerBreakdown: Record<string, number> = {};
    referrerBreakdownResult.forEach((row) => {
      const referer = row.referer || 'direct';
      referrerBreakdown[referer] = row.count;
    });

    // City breakdown (top 20)
    const cityBreakdownResult = await db
      .select({
        city: linkClicks.city,
        country: linkClicks.country,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(linkClicks.city, linkClicks.country)
      .orderBy(sql`count(*)::int DESC`)
      .limit(20);

    const cityBreakdown: Array<{ city: string | null; country: string | null; count: number }> = [];
    cityBreakdownResult.forEach((row) => {
      cityBreakdown.push({
        city: row.city,
        country: row.country,
        count: row.count,
      });
    });

    // Recent clicks (last 100)
    const recentClicks = await db
      .select({
        id: linkClicks.id,
        ipAddress: linkClicks.ipAddress,
        country: linkClicks.country,
        city: linkClicks.city,
        deviceType: linkClicks.deviceType,
        browser: linkClicks.browser,
        os: linkClicks.os,
        referer: linkClicks.referer,
        clickedAt: linkClicks.clickedAt,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .orderBy(desc(linkClicks.clickedAt))
      .limit(100);

    // Time-series data (Last 30 days)
    // Note: Drizzle raw SQL support varies by driver, ensuring safe casting
    const clicksOverTimeResult = await db
      .select({
        date: sql<string>`to_char(${linkClicks.clickedAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(sql`to_char(${linkClicks.clickedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${linkClicks.clickedAt}, 'YYYY-MM-DD')`);

    return NextResponse.json({
      link: {
        id: link.id,
        shortCode: link.shortCode,
        longUrl: link.longUrl,
        createdAt: link.createdAt,
      },
      analytics: {
        totalClicks,
        uniqueIps,
        deviceBreakdown,
        countryBreakdown,
        browserBreakdown,
        osBreakdown,
        referrerBreakdown,
        cityBreakdown,
        recentClicks,
        clicksOverTime: clicksOverTimeResult,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
