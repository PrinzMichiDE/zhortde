import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { logAdminAction, AdminAuditActions } from '@/lib/admin-audit';
import { getClientIp } from '@/lib/api-security';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  const userId = parseInt((await params).id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const currentUser = await db.query.users.findFirst({
      where: eq(users.email, auth.session.email),
    });

    if (currentUser?.id === userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.delete(users).where(eq(users.id, userId));

    await logAdminAction({
      adminUserId: auth.session.userId,
      action: AdminAuditActions.USER_DELETED,
      resourceType: 'admin',
      resourceId: userId,
      ipAddress: getClientIp(request),
      metadata: {
        deletedEmail: targetUser.email,
        deletedRole: targetUser.role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
