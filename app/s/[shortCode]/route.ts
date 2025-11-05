import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    // Finde den Link
    const link = await db.query.links.findFirst({
      where: eq(links.shortCode, shortCode),
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link nicht gefunden' },
        { status: 404 }
      );
    }

    // Erhöhe Hit-Counter
    await db
      .update(links)
      .set({ hits: sql`${links.hits} + 1` })
      .where(eq(links.id, link.id));

    // Leite weiter
    return NextResponse.redirect(link.longUrl, 301);
  } catch (error) {
    console.error('Error redirecting:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Weiterleitung' },
      { status: 500 }
    );
  }
}

