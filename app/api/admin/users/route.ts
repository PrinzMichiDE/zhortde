import { NextRequest, NextResponse } from 'next/server';
import { desc, count } from 'drizzle-orm';
import { requireSuperAdminApiAccess } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { users, links } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminApiAccess(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    });

    const linkCounts = await db
      .select({
        userId: links.userId,
        count: count(links.id),
      })
      .from(links)
      .groupBy(links.userId);

    const linkCountMap = new Map(
      linkCounts.map((entry) => [entry.userId, entry.count]),
    );

    const sanitizedUsers = allUsers.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      linksCount: linkCountMap.get(user.id) || 0,
    }));

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
