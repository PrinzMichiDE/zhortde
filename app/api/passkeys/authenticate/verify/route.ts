/**
 * Verify Passkey Authentication
 * POST /api/passkeys/authenticate/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthentication } from '@/lib/passkeys';
import { z } from 'zod';
import type { PasskeyAuthenticationVerifyResponse } from '@/types/passkey-auth';

const verifySchema = z.object({
  email: z.string().email(),
  response: z.any(), // AuthenticationResponseJSON
  ceremonyId: z.string().min(32).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, response, ceremonyId } = verifySchema.parse(body);

    const { user, loginToken } = await verifyAuthentication(
      email,
      response,
      ceremonyId,
    );

    const responseBody: PasskeyAuthenticationVerifyResponse = {
      success: true,
      loginToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        role: user.role,
      },
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('Verify passkey authentication error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 401 }
    );
  }
}
