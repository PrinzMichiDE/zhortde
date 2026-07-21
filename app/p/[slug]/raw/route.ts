import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import {
  PASTE_ACCESS_COOKIE,
  verifyPasteAccessToken,
} from '@/lib/paste-access';
import { isExpired } from '@/lib/password-protection';

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

    if (paste.expiresAt && isExpired(paste.expiresAt)) {
      return new NextResponse('Dieses Paste ist abgelaufen', { status: 410 });
    }

    // Prüfe, ob der Benutzer Zugriff hat
    if (!paste.isPublic) {
      if (!session || paste.userId !== parseInt(session.user.id)) {
        return new NextResponse('Keine Berechtigung', { status: 403 });
      }
    }

    if (
      paste.passwordHash &&
      !verifyPasteAccessToken(
        request.cookies.get(PASTE_ACCESS_COOKIE)?.value,
        slug,
        paste.passwordHash,
      )
    ) {
      return new NextResponse('Passwort erforderlich', { status: 401 });
    }

    // Gib den reinen Text zurück
    return new NextResponse(paste.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `inline; filename="${slug}.txt"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error fetching raw paste:', error);
    return new NextResponse('Serverfehler', { status: 500 });
  }
}

