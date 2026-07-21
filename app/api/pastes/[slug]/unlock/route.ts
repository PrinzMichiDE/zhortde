import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import {
  createPasteAccessToken,
  getPasteAccessCookiePath,
  PASTE_ACCESS_COOKIE,
  PASTE_ACCESS_TTL_SECONDS,
} from '@/lib/paste-access';
import { isExpired, verifyPassword } from '@/lib/password-protection';
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
} from '@/lib/rate-limit';

const unlockSchema = z.object({
  password: z.string().min(1).max(128),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const paste = await db.query.pastes.findFirst({
      where: eq(pastes.slug, slug),
    });

    if (!paste) {
      return NextResponse.json({ error: 'Paste nicht gefunden' }, { status: 404 });
    }

    if (paste.expiresAt && isExpired(paste.expiresAt)) {
      return NextResponse.json({ error: 'Dieses Paste ist abgelaufen' }, { status: 410 });
    }

    if (!paste.passwordHash) {
      return NextResponse.json(
        { error: 'Dieses Paste ist nicht passwortgeschützt' },
        { status: 400 },
      );
    }

    const rateLimitResult = await checkRateLimit(
      `${getClientIp(request)}:${slug}`,
      'access_protected_paste',
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Zu viele fehlgeschlagene Versuche. Bitte versuchen Sie es später erneut.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        },
      );
    }

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
    }

    const parsedBody = unlockSchema.safeParse(requestBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
    }

    const passwordIsValid = await verifyPassword(
      parsedBody.data.password,
      paste.passwordHash,
    );
    if (!passwordIsValid) {
      return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: `/p/${encodeURIComponent(slug)}`,
    });
    response.cookies.set({
      name: PASTE_ACCESS_COOKIE,
      value: createPasteAccessToken(slug, paste.passwordHash),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: getPasteAccessCookiePath(slug),
      maxAge: PASTE_ACCESS_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Error unlocking paste:', error);
    return NextResponse.json(
      { error: 'Fehler beim Entsperren des Paste' },
      { status: 500 },
    );
  }
}
