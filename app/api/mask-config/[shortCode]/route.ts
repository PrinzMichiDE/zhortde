import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSmartRedirectUrl } from '@/lib/smart-redirects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    const link = await db.query.links.findFirst({
      where: eq(links.shortCode, shortCode),
      with: {
        linkMasking: true,
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Check for smart redirect
    const userAgent = request.headers.get('user-agent');
    const country = null; // Could use IP geolocation here
    const smartRedirectUrl = await getSmartRedirectUrl(link.id, userAgent, country);
    const targetUrl = smartRedirectUrl || link.longUrl;

    const masking = link.linkMasking;

    return NextResponse.json({
      targetUrl,
      enableFrame: masking?.enableFrame || false,
      enableSplash: masking?.enableSplash || false,
      splashHtml: masking?.splashHtml || '',
      splashDuration: masking?.splashDurationMs || 3000,
    });
  } catch (error) {
    console.error('Mask config error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

