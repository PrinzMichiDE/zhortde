import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { isSuperAdmin } from '@/lib/admin';
import { getClientIp } from '@/lib/api-security';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export type SuperAdminSession = {
  userId: number;
  email: string;
  role: string;
};

export type SuperAdminAuthResult =
  | { authorized: true; session: SuperAdminSession }
  | { authorized: false; response: NextResponse };

export async function requireSuperAdmin(): Promise<SuperAdminAuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
    };
  }

  const userId = parseInt(session.user.id, 10);
  if (Number.isNaN(userId)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    session: {
      userId,
      email: session.user.email,
      role: session.user.role || 'user',
    },
  };
}

export async function requireSuperAdminApiAccess(
  request: NextRequest,
): Promise<SuperAdminAuthResult> {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return auth;
  }

  const rateLimit = await checkRateLimit(
    `admin:${auth.session.userId}:${getClientIp(request)}`,
    'admin_api',
  );

  if (rateLimit.success) {
    return auth;
  }

  const status = rateLimit.status === 'unavailable' ? 503 : 429;
  const error =
    rateLimit.status === 'unavailable'
      ? 'Service temporarily unavailable'
      : 'Too many requests';

  return {
    authorized: false,
    response: NextResponse.json(
      { error },
      { status, headers: getRateLimitHeaders(rateLimit) },
    ),
  };
}
