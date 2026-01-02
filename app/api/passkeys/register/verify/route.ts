/**
 * Verify Passkey Registration
 * POST /api/passkeys/register/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import { verifyRegistration } from '@/lib/passkeys';
import { z } from 'zod';

const verifySchema = z.object({
  response: z.any(), // RegistrationResponseJSON
  challenge: z.string(),
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

    const body = await request.json();
    const validated = verifySchema.parse(body);

    const passkey = await verifyRegistration(
      auth.userId,
      validated.response,
      validated.challenge,
      validated.deviceName
    );

    return NextResponse.json({
      success: true,
      passkey: {
        id: passkey.id,
        deviceName: passkey.deviceName,
        deviceType: passkey.deviceType,
        createdAt: passkey.createdAt,
      },
    });
  } catch (error) {
    console.error('Verify passkey registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 400 }
    );
  }
}
