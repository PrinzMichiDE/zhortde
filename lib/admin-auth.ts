import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { isSuperAdmin } from '@/lib/admin';

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
