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
import { monetizeUrl } from '@/lib/monetization';
import { 
  createLinkSchema, 
  shortCodeSchema,
  logSecurityEvent,
  isSecureInput,
} from '@/lib/security';

// Maximum request body size (2KB for link creation)
const MAX_BODY_SIZE = 2048;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. 🔒 Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }
    
    // 2. 🔒 Parse and validate request body size
    let body: unknown;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_SIZE) {
        return NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        );
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    const { longUrl: rawLongUrl, isPublic, customCode, password, expiresIn, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, hp } = body as Record<string, unknown>;

    // 3. 🍯 Honeypot Check (anti-bot)
    if (hp) {
      logSecurityEvent({
        type: 'suspicious_request',
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || undefined,
        details: { reason: 'honeypot_triggered' },
        timestamp: new Date(),
      });
      return NextResponse.json(
        { error: 'Bot detected' },
        { status: 400 }
      );
    }

    // 4. 🔒 Rate limiting
    const identifier = session?.user?.id || getClientIp(request);
    const action = session?.user?.id ? 'create_link_authenticated' : 'create_link_anonymous';
    const rateLimitResult = await checkRateLimit(identifier, action);

    if (!rateLimitResult.success) {
      logSecurityEvent({
        type: 'rate_limit',
        ip: getClientIp(request),
        userId: session?.user?.id ? parseInt(session.user.id) : undefined,
        details: { action, limit: rateLimitResult.limit },
        timestamp: new Date(),
      });
      
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

    // 5. 🔒 Validate URL with Zod schema
    if (!rawLongUrl || typeof rawLongUrl !== 'string') {
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      );
    }
    
    // Check for injection patterns
    if (!isSecureInput(rawLongUrl)) {
      logSecurityEvent({
        type: 'suspicious_request',
        ip: getClientIp(request),
        details: { reason: 'injection_attempt', field: 'longUrl' },
        timestamp: new Date(),
      });
      return NextResponse.json(
        { error: 'Ungültige Eingabe erkannt' },
        { status: 400 }
      );
    }

    // Parse and validate the full input
    const validationResult = createLinkSchema.safeParse({
      longUrl: rawLongUrl,
      customCode,
      password,
      expiresIn,
      isPublic: isPublic ?? true,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || 'Ungültige Eingabe' },
        { status: 400 }
      );
    }

    const validatedInput = validationResult.data;

    // 6. Monetization (Amazon Affiliate)
    const longUrl = monetizeUrl(validatedInput.longUrl);

    // 7. 🔒 Check against blocklist (malware, phishing)
    const blocked = await isUrlBlocked(validatedInput.longUrl);
    if (blocked) {
      logSecurityEvent({
        type: 'suspicious_request',
        ip: getClientIp(request),
        details: { reason: 'blocked_url', url: validatedInput.longUrl },
        timestamp: new Date(),
      });
      return NextResponse.json(
        { error: 'Diese Domain ist auf der Blocklist und kann nicht gekürzt werden' },
        { status: 403 }
      );
    }

    // 8. Generate or validate Short Code
    let shortCode: string;
    
    if (validatedInput.customCode) {
      // Validate custom code with schema
      const codeResult = shortCodeSchema.safeParse(validatedInput.customCode);
      if (!codeResult.success) {
        return NextResponse.json(
          { error: codeResult.error.issues[0]?.message || 'Ungültiger Short Code' },
          { status: 400 }
        );
      }

      const trimmedCode = codeResult.data;

      // Check if code already exists
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
      // Generate random short code
      shortCode = nanoid(8);
    }

    // 9. Hash password if provided
    const passwordHash = validatedInput.password 
      ? await hashPassword(validatedInput.password) 
      : null;

    // 10. Calculate expiration if provided
    const expiresAt = validatedInput.expiresIn 
      ? calculateExpiration(validatedInput.expiresIn) 
      : null;

    // 11. Create link with validated & sanitized data
    const newLink = await db.insert(links).values({
      shortCode,
      longUrl,
      userId: session?.user?.id ? parseInt(session.user.id) : null,
      isPublic: session ? validatedInput.isPublic : true,
      passwordHash,
      expiresAt,
      utmSource: validatedInput.utmSource,
      utmMedium: validatedInput.utmMedium,
      utmCampaign: validatedInput.utmCampaign,
      utmTerm: validatedInput.utmTerm,
      utmContent: validatedInput.utmContent,
    }).returning();

    // Inkrementiere Links Counter
    await incrementStat('links');

    // 12. 📜 Audit Log & Webhooks
    if (session?.user?.id) {
      const userId = parseInt(session.user.id);
      
      // Log Action
      await logLinkAction(newLink[0].id, userId, 'created', {
        longUrl,
        shortCode,
        isPublic: validatedInput.isPublic,
        hasPassword: !!validatedInput.password,
        hasExpiration: !!expiresAt,
        utm: { 
          utmSource: validatedInput.utmSource, 
          utmMedium: validatedInput.utmMedium, 
          utmCampaign: validatedInput.utmCampaign 
        },
        isMonetized: longUrl !== validatedInput.longUrl // Log if URL was changed for monetization
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
