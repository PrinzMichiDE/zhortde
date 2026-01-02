/**
 * Passkey Registration API
 * 
 * POST /api/passkeys/register/start - Start Passkey registration
 * POST /api/passkeys/register/verify - Verify and complete Passkey registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getRegistrationOptions, verifyRegistration } from '@/lib/passkeys';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-security';

const startRegistrationSchema = z.object({
  deviceName: z.string().optional(),
});

const verifyRegistrationSchema = z.object({
  response: z.any(), // RegistrationResponseJSON
  challenge: z.string(),
  deviceName: z.string().optional(),
});

/**
 * POST /api/passkeys/register/start
 * Start Passkey registration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action?: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();

    if (action === 'start') {
      // Start registration
      const body = await request.json();
      const validated = startRegistrationSchema.parse(body);

      const options = await getRegistrationOptions(
        auth.userId,
        auth.email
      );

      // Store challenge in session or return it (for demo, we'll return it)
      // In production, store in Redis or session
      return NextResponse.json({
        options,
        challenge: options.challenge,
      });
    } else if (action === 'verify') {
      // Verify registration
      const body = await request.json();
      const validated = verifyRegistrationSchema.parse(body);

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
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Passkey registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
