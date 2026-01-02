/**
 * Verify Passkey Authentication
 * POST /api/passkeys/authenticate/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthentication } from '@/lib/passkeys';
import { signIn } from 'next-auth/react';
import { z } from 'zod';

const verifySchema = z.object({
  email: z.string().email(),
  response: z.any(), // AuthenticationResponseJSON
  challenge: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, response, challenge } = verifySchema.parse(body);

    const user = await verifyAuthentication(email, response, challenge);

    // Create session token for NextAuth
    // In production, you'd want to use NextAuth's signIn function properly
    // For now, return user data and let client handle session creation
    
    return NextResponse.json({
      success: true,
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
