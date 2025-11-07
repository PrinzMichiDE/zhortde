import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { isExpired, verifyPassword } from '@/lib/password-protection';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { trackLinkClick } from '@/lib/analytics';
import { triggerWebhooks } from '@/lib/webhooks';
import { getSmartRedirectUrl } from '@/lib/smart-redirects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    const searchParams = request.nextUrl.searchParams;
    const providedPassword = searchParams.get('password');

    // Finde den Link with masking config
    const link = await db.query.links.findFirst({
      where: eq(links.shortCode, shortCode),
      with: {
        linkMasking: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if expired
    if (link.expiresAt && isExpired(link.expiresAt)) {
      return NextResponse.json(
        { error: 'Dieser Link ist abgelaufen' },
        { status: 410 } // 410 Gone
      );
    }

    // Check password protection
    if (link.passwordHash) {
      if (!providedPassword) {
        // Redirect to password entry page
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
        return NextResponse.redirect(`${baseUrl}/protected/${shortCode}`);
      }

      // Rate limit password attempts
      const clientIp = getClientIp(request);
      const rateLimitResult = await checkRateLimit(
        `${clientIp}:${shortCode}`,
        'access_protected_link'
      );

      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Zu viele fehlgeschlagene Versuche. Bitte versuchen Sie es später erneut.' },
          { status: 429 }
        );
      }

      // Verify password
      const isValid = await verifyPassword(providedPassword, link.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Falsches Passwort' },
          { status: 401 }
        );
      }
    }

    // Erhöhe Hit-Counter
    await db
      .update(links)
      .set({ hits: sql`${links.hits} + 1` })
      .where(eq(links.id, link.id));

    // 📊 Track detailed analytics (async, don't block redirect)
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');
    
    // Fire and forget (don't await to avoid slowing down redirect)
    trackLinkClick({
      linkId: link.id,
      ipAddress: clientIp,
      userAgent,
      referer,
    }).catch((error) => {
      console.error('Analytics tracking error:', error);
    });

    // 🔔 Trigger webhooks (fire and forget)
    if (link.userId) {
      triggerWebhooks(link.userId, 'link.clicked', {
        linkId: link.id,
        shortCode: link.shortCode,
        longUrl: link.longUrl,
        ipAddress: clientIp,
        userAgent,
        referer,
      }).catch((error) => {
        console.error('Webhook trigger error:', error);
      });
    }

    // 🎯 Check for smart redirect rules
    const country = null; // Could extract from IP with geolocation service
    const smartRedirectUrl = await getSmartRedirectUrl(link.id, userAgent, country);
    const finalUrl = smartRedirectUrl || link.longUrl;

    // 🎭 Check for link masking
    if (link.linkMasking && (link.linkMasking.enableFrame || link.linkMasking.enableSplash)) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
      return NextResponse.redirect(`${baseUrl}/mask/${shortCode}`, 302);
    }

    // Leite weiter
    return NextResponse.redirect(finalUrl, 302);
  } catch (error) {
    console.error('Error redirecting:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Weiterleitung' },
      { status: 500 }
    );
  }
}

