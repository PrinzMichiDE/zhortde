import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { isUrlBlocked } from '@/lib/blocklist';
import { incrementStat } from '@/lib/db/init-stats';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { hashPassword, calculateExpiration } from '@/lib/password-protection';
import { triggerWebhooks } from '@/lib/webhooks';
import { logLinkAction } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { longUrl, isPublic, customCode, password, expiresIn, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, hp } = body;

    // 🍯 Honeypot Check
    if (hp) {
       return NextResponse.json(
        { error: 'Bot detected' },
        { status: 400 }
      );
    }

    // Rate limiting
    const identifier = session?.user?.id || getClientIp(request);
    const action = session?.user?.id ? 'create_link_authenticated' : 'create_link_anonymous';
    const rateLimitResult = await checkRateLimit(identifier, action);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Zu viele Anfragen',
          details: `Limit: ${rateLimitResult.limit} pro Stunde. Bitte versuchen Sie es später erneut.`,
          reset: rateLimitResult.reset,
        },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    if (!longUrl) {
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      );
    }

    // Validiere URL
    try {
      new URL(longUrl);
    } catch {
      return NextResponse.json(
        { error: 'Ungültige URL' },
        { status: 400 }
      );
    }

    // Prüfe gegen Blocklist
    const blocked = await isUrlBlocked(longUrl);
    if (blocked) {
      return NextResponse.json(
        { error: 'Diese Domain ist auf der Blocklist und kann nicht gekürzt werden' },
        { status: 403 }
      );
    }

    // Generiere Short Code (Custom oder Random)
    let shortCode: string;
    
    if (customCode) {
      // Validiere Custom Code
      const trimmedCode = customCode.trim().toLowerCase();
      
      if (!/^[a-z0-9-_]+$/.test(trimmedCode)) {
        return NextResponse.json(
          { error: 'Short Code darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten' },
          { status: 400 }
        );
      }

      if (trimmedCode.length < 3) {
        return NextResponse.json(
          { error: 'Short Code muss mindestens 3 Zeichen lang sein' },
          { status: 400 }
        );
      }

      if (trimmedCode.length > 50) {
        return NextResponse.json(
          { error: 'Short Code darf maximal 50 Zeichen lang sein' },
          { status: 400 }
        );
      }

      // Prüfe ob Code bereits existiert
      const existing = await db.query.links.findFirst({
        where: eq(links.shortCode, trimmedCode),
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Dieser Short Code ist bereits vergeben' },
          { status: 409 }
        );
      }

      shortCode = trimmedCode;
    } else {
      // Generiere zufälligen Short Code
      shortCode = nanoid(8);
    }

    // Hash password if provided
    const passwordHash = password ? await hashPassword(password) : null;

    // Calculate expiration if provided
    const expiresAt = expiresIn ? calculateExpiration(expiresIn) : null;

    // Erstelle Link
    const newLink = await db.insert(links).values({
      shortCode,
      longUrl,
      userId: session?.user?.id ? parseInt(session.user.id) : null,
      isPublic: session ? isPublic : true,
      passwordHash,
      expiresAt,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    }).returning();

    // Inkrementiere Links Counter
    await incrementStat('links');

    // 📜 Audit Log & Webhooks
    if (session?.user?.id) {
      const userId = parseInt(session.user.id);
      
      // Log Action
      await logLinkAction(newLink[0].id, userId, 'created', {
        longUrl,
        shortCode,
        isPublic,
        hasPassword: !!password,
        hasExpiration: !!expiresAt,
        utm: { utmSource, utmMedium, utmCampaign }
      });

      // Trigger webhooks
      triggerWebhooks(userId, 'link.created', {
        linkId: newLink[0].id,
        shortCode: newLink[0].shortCode,
        longUrl: newLink[0].longUrl,
      }).catch((error) => {
        console.error('Webhook trigger error:', error);
      });
    }

    return NextResponse.json(
      {
        shortCode: newLink[0].shortCode,
        longUrl: newLink[0].longUrl,
        expiresAt: newLink[0].expiresAt,
        hasPassword: !!newLink[0].passwordHash,
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('Error creating link:', error);
    
    // Bessere Fehlerbehandlung
    const errorMessage = error instanceof Error ? error.message : 'Fehler beim Erstellen des Links';
    
    // Spezielle Fehlerbehandlung für DB-Verbindungsprobleme
    if (errorMessage.includes('PostgreSQL connection string') || errorMessage.includes('Invalid URL')) {
      return NextResponse.json(
        { 
          error: 'Datenbank-Konfigurationsfehler',
          details: process.env.NODE_ENV === 'development' ? errorMessage : 'Bitte kontaktieren Sie den Administrator'
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen des Links',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
