import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { isUrlBlocked } from '@/lib/blocklist';
import { incrementStat } from '@/lib/db/init-stats';

/**
 * Öffentliche API zum Kürzen von URLs
 * POST /api/v1/shorten
 * 
 * Body:
 * {
 *   "url": "https://example.com/very/long/url"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "shortUrl": "http://localhost:3000/s/abc123",
 *   "shortCode": "abc123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, customCode } = body;

    // Validierung
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'URL ist erforderlich',
          message: 'Bitte geben Sie eine gültige URL an',
        },
        { status: 400 }
      );
    }

    // URL-Format validieren
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige URL',
          message: 'Die angegebene URL hat kein gültiges Format',
        },
        { status: 400 }
      );
    }

    // Nur HTTP(S) URLs erlauben
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültiges Protokoll',
          message: 'Nur HTTP und HTTPS URLs sind erlaubt',
        },
        { status: 400 }
      );
    }

    // Prüfe gegen Blocklist
    const blocked = await isUrlBlocked(url);
    if (blocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Domain blockiert',
          message: 'Diese Domain steht auf der Blocklist und kann nicht gekürzt werden',
        },
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
          {
            success: false,
            error: 'Ungültiger Short Code',
            message: 'Short Code darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten',
          },
          { status: 400 }
        );
      }

      if (trimmedCode.length < 3 || trimmedCode.length > 50) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ungültige Länge',
            message: 'Short Code muss zwischen 3 und 50 Zeichen lang sein',
          },
          { status: 400 }
        );
      }

      // Prüfe ob Code bereits existiert
      const existing = await db.query.links.findFirst({
        where: eq(links.shortCode, trimmedCode),
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Short Code vergeben',
            message: 'Dieser Short Code ist bereits vergeben',
          },
          { status: 409 }
        );
      }

      shortCode = trimmedCode;
    } else {
      // Generiere zufälligen Short Code
      shortCode = nanoid(8);
    }

    // Erstelle Link (anonym, öffentlich)
    await db.insert(links).values({
      shortCode,
      longUrl: url,
      userId: null, // Anonym
      isPublic: true,
    });

    // Inkrementiere Links Counter
    await incrementStat('links');

    // Basis-URL ermitteln
    const baseUrl = process.env.NEXTAUTH_URL || 
                    request.headers.get('origin') || 
                    `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;

    const shortUrl = `${baseUrl}/s/${shortCode}`;

    return NextResponse.json(
      {
        success: true,
        shortUrl,
        shortCode,
        originalUrl: url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in shorten API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Serverfehler',
        message: 'Ein interner Fehler ist aufgetreten',
      },
      { status: 500 }
    );
  }
}

/**
 * API-Dokumentation
 * GET /api/v1/shorten
 */
export async function GET() {
  return NextResponse.json({
    name: 'Zhort URL Shortener API',
    version: '1.0',
    endpoints: {
      shorten: {
        method: 'POST',
        path: '/api/v1/shorten',
        description: 'Kürzt eine lange URL',
        body: {
          url: 'string (required) - Die zu kürzende URL',
        },
        response: {
          success: 'boolean',
          shortUrl: 'string - Die gekürzte URL',
          shortCode: 'string - Der Short Code',
          originalUrl: 'string - Die Original-URL',
        },
        example: {
          request: {
            url: 'https://example.com/very/long/url',
          },
          response: {
            success: true,
            shortUrl: 'https://zhort.app/s/abc12345',
            shortCode: 'abc12345',
            originalUrl: 'https://example.com/very/long/url',
          },
        },
      },
    },
    blocklist: {
      description: 'URLs werden gegen die Hagezi DNS Blocklist geprüft',
      url: 'https://github.com/hagezi/dns-blocklists',
    },
  });
}

