import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { users, pastes, links, pasteTags, tags } from '@/lib/db/schema';
import { isSuperAdmin } from '@/lib/admin';
import { eq } from 'drizzle-orm';
import { inArray } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const userId = parseInt((await params).id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    // Prevent deleting self
    const currentUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email)
    });
    
    // Prevent deleting self
    if (currentUser?.id === userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Prevent deleting super admins (only super admins can manage each other)
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (targetUser?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 403 }
      );
    }

    // Cascade delete pasteTags and tags before deleting pastes
    await db.delete(pasteTags).where(inArray(pasteTags.pasteId, (
      await db.select({ id: pastes.id }).from(pastes).where(eq(pastes.userId, userId))
    ).map(p => p.id)));
    await db.delete(tags).where(inArray(tags.id, (
      await db.select({ id: pasteTags.tagId }).from(pasteTags).where(inArray(pasteTags.pasteId, (
        await db.select({ id: pastes.id }).from(pastes).where(eq(pastes.userId, userId))
      ).map(p => p.id)))
    ).map(t => t.id)));

    // Delete associated pastes
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
