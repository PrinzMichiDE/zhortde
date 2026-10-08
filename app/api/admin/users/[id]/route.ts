import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { users, pastes, links } from '@/lib/db/schema';
import { isSuperAdmin } from '@/lib/admin';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const userId = parseInt((await params).id);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    // Prevent deleting self
    const currentUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email)
    });
    
    if (currentUser?.id === userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Delete associated pastes (which cascade to paste_tags)
    await db.delete(pastes).where(eq(pastes.userId, userId));

    // Delete associated links
    await db.delete(links).where(eq(links.userId, userId));

    // Delete the user
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
