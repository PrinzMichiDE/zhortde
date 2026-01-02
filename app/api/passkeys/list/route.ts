/**
 * List User's Passkeys
 * GET /api/passkeys/list
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import { getUserPasskeys } from '@/lib/passkeys';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const passkeys = await getUserPasskeys(auth.userId);

    return NextResponse.json({
      passkeys: passkeys.map(p => ({
        id: p.id,
        deviceName: p.deviceName,
        deviceType: p.deviceType,
        lastUsedAt: p.lastUsedAt,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('List passkeys error:', error);
    return NextResponse.json(
      { error: 'Failed to list passkeys' },
      { status: 500 }
    );
  }
}
