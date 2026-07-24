import { NextRequest, NextResponse } from 'next/server';
import { count, eq, gte, sql } from 'drizzle-orm';
import { requireSuperAdminApiAccess } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import {
  auditLogs,
  links,
  passkeyAuthAttempts,
  pastes,
  rateLimits,
  users,
} from '@/lib/db/schema';
import { getBlocklistStats } from '@/lib/db/blocklist-service';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminApiAccess(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const [
      userCount,
      linkCount,
      pasteCount,
      rateLimitCount,
      passkeyAttemptCount,
      recentAdminActions,
      blocklistStats,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(links),
      db.select({ count: count() }).from(pastes),
      db.select({ count: count() }).from(rateLimits),
      db.select({ count: count() }).from(passkeyAuthAttempts),
      db
        .select({ count: count() })
        .from(auditLogs)
        .where(eq(auditLogs.resourceType, 'admin')),
      getBlocklistStats(),
    ]);

    const activeRateLimits = await db
      .select({ count: count() })
      .from(rateLimits)
      .where(gte(rateLimits.windowStart, sql`now() - interval '1 hour'`));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      users: userCount[0]?.count ?? 0,
      links: linkCount[0]?.count ?? 0,
      pastes: pasteCount[0]?.count ?? 0,
      rateLimits: {
        total: rateLimitCount[0]?.count ?? 0,
        activeLastHour: activeRateLimits[0]?.count ?? 0,
      },
      passkeyAuthAttempts: passkeyAttemptCount[0]?.count ?? 0,
      adminAuditEvents: recentAdminActions[0]?.count ?? 0,
      blocklist: {
        total: blocklistStats.total,
        lastUpdate: blocklistStats.lastUpdate,
        ageHours: blocklistStats.ageHours,
        status: blocklistStats.total > 0 ? 'active' : 'empty',
      },
    });
  } catch (error) {
    console.error('Error building admin overview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
