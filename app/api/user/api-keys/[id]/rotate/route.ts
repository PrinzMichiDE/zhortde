import { NextRequest, NextResponse } from 'next/server';
import { rotateApiKey } from '@/lib/api-keys';
import { logAuditEvent } from '@/lib/enterprise-features';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * POST /api/user/api-keys/[id]/rotate
 * Rotates an API key: the old key is invalidated, a brand-new key is issued.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;
    const apiKeyId = parseInt(id, 10);

    if (isNaN(apiKeyId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const rotated = await rotateApiKey(apiKeyId, userId);

    if (!rotated) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Audit trail (fire and forget)
    logAuditEvent({
      userId,
      action: 'api_key.rotated',
      resourceType: 'api_key',
      resourceId: apiKeyId,
    }).catch((error) => {
      console.error('Audit log error:', error);
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKeyId,
        ...rotated,
      },
    });
  } catch (error) {
    console.error('API key rotation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}