import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    const paste = await db.query.pastes.findFirst({
      where: eq(pastes.slug, slug),
    });

    if (!paste) {
      return new NextResponse('Paste nicht gefunden', { status: 404 });
    }

    // Prüfe, ob der Benutzer Zugriff hat
    if (!paste.isPublic) {
      if (!session || paste.userId !== parseInt(session.user.id)) {
        return new NextResponse('Keine Berechtigung', { status: 403 });
      }
    }

    // Gib den reinen Text zurück
    return new NextResponse(paste.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `inline; filename="${slug}.txt"`,
      },
    });
  } catch (error) {
    console.error('Error fetching raw paste:', error);
    return new NextResponse('Serverfehler', { status: 500 });
  }
}

