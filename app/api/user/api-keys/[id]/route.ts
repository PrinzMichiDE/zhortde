import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logAuditEvent } from '@/lib/enterprise-features';

/**
 * DELETE /api/user/api-keys/[id] - Delete an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const apiKeyId = parseInt(id, 10);

    if (isNaN(apiKeyId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Delete only if it belongs to the user
    const result = await db
      .delete(apiKeys)
      .where(
        and(
          eq(apiKeys.id, apiKeyId),
          eq(apiKeys.userId, parseInt(session.user.id))
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Audit trail (fire and forget)
    logAuditEvent({
      userId: parseInt(session.user.id),
      action: 'api_key.deleted',
      resourceType: 'api_key',
      resourceId: apiKeyId,
    }).catch((error) => {
      console.error('Audit log error:', error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Keys DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

