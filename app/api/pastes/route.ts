import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { hashPassword, calculateExpiration } from '@/lib/password-protection';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { content, syntaxHighlightingLanguage, isPublic, password, expiresIn } = await request.json();

    // Rate limiting
    const identifier = session?.user?.id || getClientIp(request);
    const action = session?.user?.id ? 'create_paste_authenticated' : 'create_paste_anonymous';
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

    if (!content) {
      return NextResponse.json(
        { error: 'Inhalt ist erforderlich' },
        { status: 400 }
      );
    }

    // Generiere eindeutigen Slug
    const slug = nanoid(10);

    // Hash password if provided
    const passwordHash = password ? await hashPassword(password) : null;

    // Calculate expiration if provided
    const expiresAt = expiresIn ? calculateExpiration(expiresIn) : null;

    // Erstelle Paste
    const newPaste = await db.insert(pastes).values({
      slug,
      content,
      syntaxHighlightingLanguage: syntaxHighlightingLanguage || null,
      userId: session?.user?.id ? parseInt(session.user.id) : null,
      isPublic: session ? isPublic : true,
      passwordHash,
      expiresAt,
    }).returning();

    return NextResponse.json(
      {
        slug: newPaste[0].slug,
        expiresAt: newPaste[0].expiresAt,
        hasPassword: !!newPaste[0].passwordHash,
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Paste' },
      { status: 500 }
    );
  }
}

