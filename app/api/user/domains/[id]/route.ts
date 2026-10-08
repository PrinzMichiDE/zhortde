import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { customDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logAuditEvent } from '@/lib/enterprise-features';

/**
 * DELETE /api/user/domains/[id] - Remove a custom domain (owner only)
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
    const domainId = parseInt(id, 10);
    if (isNaN(domainId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    const deleted = await db
      .delete(customDomains)
      .where(
        and(
          eq(customDomains.id, domainId),
          eq(customDomains.userId, userId)
        )
      )
      .returning({ id: customDomains.id, domain: customDomains.domain });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Custom domain not found' },
        { status: 404 }
      );
    }

    logAuditEvent({
      userId,
      action: 'custom_domain.deleted',
      resourceType: 'custom_domain',
      resourceId: domainId,
      changes: { domain: deleted[0].domain },
    }).catch((error) => {
      console.error('Audit log error:', error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom domain:', error);
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
  }
}