import { db } from './db';
import { teams, teamMembers, links, usageTracking, ipWhitelist } from './db/schema';
import { eq, and, gte, lte, sql, count } from 'drizzle-orm';

/**
 * Enterprise Features Library
 * Provides functionality for enterprise-level features like quotas, IP whitelisting, etc.
 */

/**
 * Check if a team has reached its usage quota
 */
export async function checkTeamQuota(teamId: number): Promise<{
  allowed: boolean;
  current: number;
  quota: number | null;
  resetDate: Date | null;
}> {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return { allowed: false, current: 0, quota: null, resetDate: null };
  }

  // If no quota set, unlimited
  if (!team.usageQuota) {
    return { allowed: true, current: team.currentUsage || 0, quota: null, resetDate: team.usageResetDate || null };
  }

  // Check if quota reset date has passed
  if (team.usageResetDate && new Date(team.usageResetDate) < new Date()) {
    // Reset usage
    await db.update(teams)
      .set({ 
        currentUsage: 0,
        usageResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      })
      .where(eq(teams.id, teamId));
    
    return { allowed: true, current: 0, quota: team.usageQuota, resetDate: team.usageResetDate };
  }

  const current = team.currentUsage || 0;
  const allowed = current < team.usageQuota;

  return {
    allowed,
    current,
    quota: team.usageQuota,
    resetDate: team.usageResetDate || null,
  };
}

/**
 * Increment team usage counter
 */
export async function incrementTeamUsage(teamId: number, amount: number = 1): Promise<void> {
  await db.update(teams)
    .set({ 
      currentUsage: sql`${teams.currentUsage} + ${amount}`,
    })
    .where(eq(teams.id, teamId));
}

/**
 * Check if IP address is whitelisted for team/user
 */
export async function isIpWhitelisted(
  ipAddress: string,
  teamId?: number,
  userId?: number
): Promise<boolean> {
  if (!teamId && !userId) {
    return true; // No restrictions
  }

  const conditions = [
    eq(ipWhitelist.isActive, true),
  ];

  if (teamId) {
    conditions.push(eq(ipWhitelist.teamId, teamId));
  }
  if (userId) {
    conditions.push(eq(ipWhitelist.userId, userId));
  }

  const whitelistEntries = await db.query.ipWhitelist.findMany({
    where: and(...conditions),
  });

  if (whitelistEntries.length === 0) {
    return true; // No whitelist = allow all
  }

  // Check if IP matches any whitelist entry
  for (const entry of whitelistEntries) {
    if (matchesIpRange(ipAddress, entry.ipAddress)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if IP matches CIDR range or exact IP
 */
function matchesIpRange(ip: string, range: string): boolean {
  // Exact match
  if (ip === range) {
    return true;
  }

  // CIDR notation (e.g., "192.168.1.0/24")
  if (range.includes('/')) {
    const [network, prefixLength] = range.split('/');
    const prefix = parseInt(prefixLength, 10);
    
    // Simple CIDR matching (for IPv4)
    const ipParts = ip.split('.').map(Number);
    const networkParts = network.split('.').map(Number);
    
    if (ipParts.length !== 4 || networkParts.length !== 4) {
      return false;
    }

    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const networkNum = (networkParts[0] << 24) | (networkParts[1] << 16) | (networkParts[2] << 8) | networkParts[3];

    return (ipNum & mask) === (networkNum & mask);
  }

  return false;
}

/**
 * Get team usage statistics
 */
export async function getTeamUsageStats(teamId: number, period: 'daily' | 'monthly' | 'yearly' = 'monthly') {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date = now;

  switch (period) {
    case 'daily':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'monthly':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      periodStart = new Date(now.getFullYear(), 0, 1);
      break;
  }

  const stats = await db
    .select({
      resourceType: usageTracking.resourceType,
      totalCount: sql<number>`sum(${usageTracking.count})::int`,
    })
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.teamId, teamId),
        gte(usageTracking.periodStart, periodStart),
        lte(usageTracking.periodEnd, periodEnd)
      )
    )
    .groupBy(usageTracking.resourceType);

  return stats;
}

/**
 * Track usage for a resource
 */
export async function trackUsage(params: {
  teamId?: number;
  userId?: number;
  resourceType: 'link' | 'click' | 'api_call' | 'export';
  resourceId?: number;
  count?: number;
  metadata?: Record<string, any>;
}) {
  const { teamId, userId, resourceType, resourceId, count = 1, metadata } = params;

  if (!teamId && !userId) {
    return; // Can't track without team or user
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  await db.insert(usageTracking).values({
    teamId: teamId || null,
    userId: userId || null,
    resourceType,
    resourceId: resourceId || null,
    count,
    period: 'monthly',
    periodStart,
    periodEnd,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  // Also increment team usage counter if teamId provided
  if (teamId) {
    await incrementTeamUsage(teamId, count);
  }
}

/**
 * Check if user has permission in team
 */
export async function checkTeamPermission(
  userId: number,
  teamId: number,
  permission: 'canCreateLinks' | 'canEditLinks' | 'canDeleteLinks' | 'canViewAnalytics' | 'canManageTeam' | 'canExportData'
): Promise<boolean> {
  const member = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.userId, userId),
      eq(teamMembers.teamId, teamId)
    ),
  });

  if (!member) {
    return false;
  }

  // Owner and admin have all permissions
  if (member.role === 'owner' || member.role === 'admin') {
    return true;
  }

  // Check custom permissions
  if (member.permissions) {
    try {
      const permissions = JSON.parse(member.permissions);
      return permissions[permission] === true;
    } catch {
      return false;
    }
  }

  // Default permissions based on role
  const defaultPermissions: Record<string, Record<string, boolean>> = {
    member: {
      canCreateLinks: true,
      canEditLinks: true,
      canDeleteLinks: false,
      canViewAnalytics: true,
      canManageTeam: false,
      canExportData: true,
    },
    viewer: {
      canCreateLinks: false,
      canEditLinks: false,
      canDeleteLinks: false,
      canViewAnalytics: true,
      canManageTeam: false,
      canExportData: false,
    },
  };

  return defaultPermissions[member.role]?.[permission] || false;
}

/**
 * Check if short code is reserved for enterprise
 */
export async function isReservedShortCode(shortCode: string, teamId?: number): Promise<boolean> {
  if (!teamId) {
    return false;
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team || !team.reservedShortCodes) {
    return false;
  }

  try {
    const reservedCodes = JSON.parse(team.reservedShortCodes) as string[];
    return reservedCodes.includes(shortCode);
  } catch {
    return false;
  }
}
