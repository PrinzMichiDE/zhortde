/**
 * Verify Passkey Authentication
 * POST /api/passkeys/authenticate/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthentication } from '@/lib/passkeys';
import { issuePasskeyLoginToken } from '@/lib/auth/passkey-login-token';
import { z } from 'zod';

const verifySchema = z.object({
  email: z.string().email(),
  response: z.any(), // AuthenticationResponseJSON
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, response } = verifySchema.parse(body);

    const user = await verifyAuthentication(email, response);
    const loginToken = await issuePasskeyLoginToken(user.id);

    return NextResponse.json({
      success: true,
      loginToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify passkey authentication error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 401 }
    );
  }
}
