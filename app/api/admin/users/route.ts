import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { isSuperAdmin } from '@/lib/admin';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      with: {
        links: true, // simplified count usually better but let's just get length
      }
    });

    const sanitizedUsers = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      linksCount: u.links.length
    }));

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
