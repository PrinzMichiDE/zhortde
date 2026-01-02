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
    const clicksOverTimeResult = await db
      .select({
        date: sql<string>`to_char(${linkClicks.clickedAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(sql`to_char(${linkClicks.clickedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${linkClicks.clickedAt}, 'YYYY-MM-DD')`);

    // Hourly breakdown (24 hours)
    const hourlyBreakdownResult = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${linkClicks.clickedAt})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(sql`EXTRACT(HOUR FROM ${linkClicks.clickedAt})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${linkClicks.clickedAt})`);

    const hourlyBreakdown: Record<number, number> = {};
    hourlyBreakdownResult.forEach((row) => {
      hourlyBreakdown[row.hour] = row.count;
    });

    // Day of week breakdown
    const dayOfWeekBreakdownResult = await db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${linkClicks.clickedAt})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(sql`EXTRACT(DOW FROM ${linkClicks.clickedAt})`)
      .orderBy(sql`EXTRACT(DOW FROM ${linkClicks.clickedAt})`);

    const dayOfWeekBreakdown: Record<number, number> = {};
    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    dayOfWeekBreakdownResult.forEach((row) => {
      dayOfWeekBreakdown[row.dayOfWeek] = row.count;
    });

    // Monthly breakdown
    const monthlyBreakdownResult = await db
      .select({
        month: sql<string>`to_char(${linkClicks.clickedAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, linkIdNum))
      .groupBy(sql`to_char(${linkClicks.clickedAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${linkClicks.clickedAt}, 'YYYY-MM')`);

    const monthlyBreakdown: Array<{ month: string; count: number }> = [];
    monthlyBreakdownResult.forEach((row) => {
      monthlyBreakdown.push({ month: row.month, count: row.count });
    });

    // Calculate advanced metrics
    const linkCreatedAt = new Date(link.createdAt);
    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - linkCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));
    const averageClicksPerDay = totalClicks / daysSinceCreation;
    
    // Peak hour calculation
    let peakHour = 0;
    let peakHourClicks = 0;
    Object.entries(hourlyBreakdown).forEach(([hour, count]) => {
      if (count > peakHourClicks) {
        peakHourClicks = count;
        peakHour = parseInt(hour);
      }
    });

    // Peak day calculation
    let peakDay = 0;
    let peakDayClicks = 0;
    Object.entries(dayOfWeekBreakdown).forEach(([day, count]) => {
      if (count > peakDayClicks) {
        peakDayClicks = count;
        peakDay = parseInt(day);
      }
    });

    // Calculate growth rate (last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentClicksResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(linkClicks)
      .where(
        sql`${linkClicks.linkId} = ${linkIdNum} AND ${linkClicks.clickedAt} >= ${sevenDaysAgo.toISOString()}`
      );
    const recentClicksCount = recentClicksResult[0]?.count || 0;

    const previousClicksResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(linkClicks)
      .where(
        sql`${linkClicks.linkId} = ${linkIdNum} AND ${linkClicks.clickedAt} >= ${fourteenDaysAgo.toISOString()} AND ${linkClicks.clickedAt} < ${sevenDaysAgo.toISOString()}`
      );
    const previousClicksCount = previousClicksResult[0]?.count || 0;

    const growthRate = previousClicksCount > 0 
      ? ((recentClicksCount - previousClicksCount) / previousClicksCount) * 100 
      : recentClicksCount > 0 ? 100 : 0;

    // Top referrers (domains only)
    const referrerDomains: Record<string, number> = {};
    Object.entries(referrerBreakdown).forEach(([referer, count]) => {
      if (referer !== 'direct') {
        try {
          const url = new URL(referer);
          const domain = url.hostname.replace('www.', '');
          referrerDomains[domain] = (referrerDomains[domain] || 0) + count;
        } catch {
          // Invalid URL, skip
        }
      }
    });

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
        referrerDomains,
        cityBreakdown,
        recentClicks,
        clicksOverTime: clicksOverTimeResult,
        hourlyBreakdown,
        dayOfWeekBreakdown,
        monthlyBreakdown,
        metrics: {
          averageClicksPerDay: Math.round(averageClicksPerDay * 100) / 100,
          peakHour,
          peakHourClicks,
          peakDay,
          peakDayName: dayNames[peakDay] || 'Unknown',
          peakDayClicks,
          growthRate: Math.round(growthRate * 100) / 100,
          daysSinceCreation,
          recentClicksCount,
          previousClicksCount,
        },
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
