import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, linkClicks } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkIdNum = parseInt(linkId);
    if (isNaN(linkIdNum)) {
      return NextResponse.json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Get all clicks
    const clicks = await db.query.linkClicks.findMany({
      where: eq(linkClicks.linkId, linkIdNum),
      orderBy: [desc(linkClicks.clickedAt)],
    });

    if (format === 'json') {
      // Calculate summary statistics
      const uniqueIps = new Set(clicks.map(c => c.ipAddress).filter(Boolean)).size;
      const deviceBreakdown: Record<string, number> = {};
      const countryBreakdown: Record<string, number> = {};
      const browserBreakdown: Record<string, number> = {};
      const osBreakdown: Record<string, number> = {};
      
      clicks.forEach(click => {
        if (click.deviceType) deviceBreakdown[click.deviceType] = (deviceBreakdown[click.deviceType] || 0) + 1;
        if (click.country) countryBreakdown[click.country] = (countryBreakdown[click.country] || 0) + 1;
        if (click.browser) browserBreakdown[click.browser] = (browserBreakdown[click.browser] || 0) + 1;
        if (click.os) osBreakdown[click.os] = (osBreakdown[click.os] || 0) + 1;
      });

      return NextResponse.json({
        success: true,
        link: {
          shortCode: link.shortCode,
          longUrl: link.longUrl,
          createdAt: link.createdAt,
        },
        summary: {
          totalClicks: clicks.length,
          uniqueIps,
          dateRange: {
            firstClick: clicks.length > 0 ? clicks[clicks.length - 1].clickedAt.toISOString() : null,
            lastClick: clicks.length > 0 ? clicks[0].clickedAt.toISOString() : null,
          },
          breakdowns: {
            devices: deviceBreakdown,
            countries: countryBreakdown,
            browsers: browserBreakdown,
            operatingSystems: osBreakdown,
          },
        },
        clicks: clicks.map(click => ({
          id: click.id,
          ipAddress: click.ipAddress,
          country: click.country,
          city: click.city,
          deviceType: click.deviceType,
          browser: click.browser,
          os: click.os,
          referer: click.referer,
          clickedAt: click.clickedAt.toISOString(),
        })),
      });
    }

    // CSV format
    const csvRows = [
      'IP Address,Country,City,Device Type,Browser,OS,Referer,Clicked At',
      ...clicks.map(click => [
        click.ipAddress || '',
        click.country || '',
        click.city || '',
        click.deviceType || '',
        click.browser || '',
        click.os || '',
        click.referer || '',
        click.clickedAt.toISOString(),
      ].join(',')),
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${link.shortCode}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
