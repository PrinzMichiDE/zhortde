import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const pasteId = parseInt(id);
    const userId = parseInt(session.user.id);

    // Lösche das Paste nur, wenn es dem Benutzer gehört
    const result = await db
      .delete(pastes)
      .where(and(eq(pastes.id, pasteId), eq(pastes.userId, userId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Paste nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting paste:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Paste' },
      { status: 500 }
    );
  }
}

