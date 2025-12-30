import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { users, links } from '@/lib/db/schema';
import { isSuperAdmin } from '@/lib/admin';
import { desc, eq, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Get all users
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    });

    // Get link counts per user
    const linkCounts = await db
      .select({
        userId: links.userId,
        count: count(links.id),
      })
      .from(links)
      .groupBy(links.userId);
    
    // Create a map for quick lookup
    const linkCountMap = new Map(
      linkCounts.map(lc => [lc.userId, lc.count])
    );

    const sanitizedUsers = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      linksCount: linkCountMap.get(u.id) || 0
    }));

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
