import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Get user's links
    const userLinks = await db.query.links.findMany({
      where: eq(links.userId, userId),
      orderBy: [desc(links.createdAt)],
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    if (format === 'json') {
      const jsonData = userLinks.map(link => ({
        id: link.id,
        shortCode: link.shortCode,
        shortUrl: `${baseUrl}/s/${link.shortCode}`,
        longUrl: link.longUrl,
        hits: link.hits,
        isPublic: link.isPublic,
        createdAt: link.createdAt.toISOString(),
        expiresAt: link.expiresAt?.toISOString() || null,
      }));

      return NextResponse.json({
        success: true,
        total: jsonData.length,
        links: jsonData,
      });
    }

    // CSV format
    const csvRows = [
      'Short Code,Short URL,Long URL,Clicks,Status,Created At,Expires At',
      ...userLinks.map(link => {
        const shortUrl = `${baseUrl}/s/${link.shortCode}`;
        return [
          link.shortCode,
          shortUrl,
          `"${link.longUrl.replace(/"/g, '""')}"`,
          link.hits,
          link.isPublic ? 'Public' : 'Private',
          link.createdAt.toISOString(),
          link.expiresAt?.toISOString() || '',
        ].join(',');
      }),
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="zhort-links-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export links' },
      { status: 500 }
    );
  }
}
