import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { isUrlBlocked } from '@/lib/blocklist';
import { incrementStat } from '@/lib/db/init-stats';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { longUrl, isPublic, customCode } = await request.json();

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

    // Erstelle Link
    const newLink = await db.insert(links).values({
      shortCode,
      longUrl,
      userId: session?.user?.id ? parseInt(session.user.id) : null,
      isPublic: session ? isPublic : true,
    }).returning();

    // Inkrementiere Links Counter
    await incrementStat('links');

    return NextResponse.json({
      shortCode: newLink[0].shortCode,
      longUrl: newLink[0].longUrl,
    });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Links' },
      { status: 500 }
    );
  }
}

