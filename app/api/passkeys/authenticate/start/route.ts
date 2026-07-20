/**
 * Start Passkey Authentication
 * POST /api/passkeys/authenticate/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticationOptions } from '@/lib/passkeys';
import { z } from 'zod';
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
} from '@/lib/rate-limit';

const startSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(clientIp, 'passkey_auth_start');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many passkey authentication attempts' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        },
      );
    }

    const body = await request.json();
    const { email } = startSchema.parse(body);

    const { options, ceremonyId } = await getAuthenticationOptions(email);

    return NextResponse.json({
      options,
      ceremonyId,
    });
  } catch (error) {
    console.error('Start passkey authentication error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start authentication' },
      { status: 400 }
    );
  }
}
