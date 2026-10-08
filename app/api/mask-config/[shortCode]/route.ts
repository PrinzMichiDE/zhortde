import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSmartRedirectUrl } from '@/lib/smart-redirects';
import { getGeoLocation } from '@/lib/analytics';
import { isLinkScheduled } from '@/lib/link-scheduling';
import { selectVariant } from '@/lib/ab-testing';
import { resolveRedirectTarget } from '@/lib/redirect-target';
import { getClientIp } from '@/lib/rate-limit';
import { getActivePixels } from '@/lib/tracking-pixels';

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

    const masking = link.linkMasking;
    const userAgent = request.headers.get('user-agent');
    const geo = await getGeoLocation(getClientIp(request));

    // 📅 Enforce scheduling for masked links too
    const schedule = await isLinkScheduled(link.id);
    if (!schedule.isActive) {
      return NextResponse.json({
        inactive: true,
        fallbackUrl: schedule.fallbackUrl || null,
        targetUrl: null,
        enableFrame: false,
        enableSplash: false,
        splashHtml: '',
        splashDuration: masking?.splashDurationMs || 3000,
        pixels: [],
      });
    }

    // 🧪 A/B variant + 🎯 smart redirects
    const variantUrl = await selectVariant(link.id);
    const resolved = resolveRedirectTarget({
      longUrl: link.longUrl,
      schedule,
      variantUrl,
    });

    let targetUrl = resolved.url;
    if (!variantUrl) {
      const smartRedirectUrl = await getSmartRedirectUrl(link.id, userAgent, geo.country);
      if (smartRedirectUrl) {
        targetUrl = smartRedirectUrl;
      }
    }

    // 📡 Tracking pixels configured for this link
    const pixels = await getActivePixels(link.id);

    return NextResponse.json({
      inactive: false,
      fallbackUrl: null,
      targetUrl,
      enableFrame: masking?.enableFrame || false,
      enableSplash: masking?.enableSplash || false,
      splashHtml: masking?.splashHtml || '',
      splashDuration: masking?.splashDurationMs || 3000,
      pixels,
    });
  } catch (error) {
    console.error('Mask config error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}