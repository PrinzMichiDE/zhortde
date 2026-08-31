import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10), 1),
    MAX_LIMIT,
  );
  const offset = (page - 1) * limit;

  try {
    const whereClause = eq(auditLogs.resourceType, 'admin');

    const [entries, totalRows] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          resourceType: auditLogs.resourceType,
          resourceId: auditLogs.resourceId,
          ipAddress: auditLogs.ipAddress,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
          actorEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(whereClause),
    ]);

    const total = totalRows[0]?.count ?? 0;

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      entries: entries.map((entry) => ({
        id: entry.id,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        metadata: entry.metadata ? safeParseJson(entry.metadata) : null,
        createdAt: entry.createdAt,
        actorEmail: entry.actorEmail,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
