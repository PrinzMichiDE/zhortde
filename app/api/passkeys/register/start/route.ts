/**
 * Start Passkey Registration
 * POST /api/passkeys/register/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import { getRegistrationOptions } from '@/lib/passkeys';
import { z } from 'zod';

const startSchema = z.object({
  deviceName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { deviceName } = startSchema.parse(body);

    const options = await getRegistrationOptions(
      auth.userId,
      auth.email
    );

    return NextResponse.json({
      options,
      challenge: options.challenge,
    });
  } catch (error) {
    console.error('Start passkey registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start registration' },
      { status: 500 }
    );
  }
}
