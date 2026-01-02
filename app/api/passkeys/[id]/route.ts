/**
 * Delete Passkey
 * DELETE /api/passkeys/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import { deletePasskey } from '@/lib/passkeys';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const passkeyId = parseInt(id);

    if (isNaN(passkeyId)) {
      return NextResponse.json(
        { error: 'Invalid passkey ID' },
        { status: 400 }
      );
    }

    await deletePasskey(auth.userId, passkeyId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete passkey error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete passkey' },
      { status: 500 }
    );
  }
}
