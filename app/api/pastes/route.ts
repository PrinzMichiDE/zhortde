import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { content, syntaxHighlightingLanguage, isPublic } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Inhalt ist erforderlich' },
        { status: 400 }
      );
    }

    // Generiere eindeutigen Slug
    const slug = nanoid(10);

    // Erstelle Paste
    const newPaste = await db.insert(pastes).values({
      slug,
      content,
      syntaxHighlightingLanguage: syntaxHighlightingLanguage || null,
      userId: session?.user?.id ? parseInt(session.user.id) : null,
      isPublic: session ? isPublic : true,
    }).returning();

    return NextResponse.json({
      slug: newPaste[0].slug,
    });
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Paste' },
      { status: 500 }
    );
  }
}

