/**
 * Start Passkey Authentication
 * POST /api/passkeys/authenticate/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticationOptions } from '@/lib/passkeys';
import { z } from 'zod';

const startSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = startSchema.parse(body);

    const { options } = await getAuthenticationOptions(email);

    return NextResponse.json({
      options,
    });
  } catch (error) {
    console.error('Start passkey authentication error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start authentication' },
      { status: 400 }
    );
  }
}
