import { db } from './db';
import { 
  scheduledReports, 
  approvalWorkflows, 
  linkApprovals, 
  linkTemplates,
  auditLogs,
  teamActivityFeed,
  archivedLinks,
  links,
  teams
} from './db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Advanced Enterprise Features Library
 */

/**
 * Create a scheduled report
 */
export async function createScheduledReport(params: {
  teamId?: number;
  userId: number;
  name: string;
  reportType: 'analytics' | 'usage' | 'compliance' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format?: 'pdf' | 'csv' | 'json' | 'html';
  filters?: Record<string, any>;
}) {
  const { teamId, userId, name, reportType, frequency, recipients, format = 'pdf', filters } = params;

  // Calculate next send date
  const now = new Date();
  let nextSendAt = new Date();
  
  switch (frequency) {
    case 'daily':
      nextSendAt.setDate(now.getDate() + 1);
      nextSendAt.setHours(9, 0, 0, 0); // 9 AM
      break;
    case 'weekly':
      nextSendAt.setDate(now.getDate() + 7);
      nextSendAt.setHours(9, 0, 0, 0);
      break;
    case 'monthly':
      nextSendAt.setMonth(now.getMonth() + 1);
      nextSendAt.setDate(1);
      nextSendAt.setHours(9, 0, 0, 0);
      break;
  }

  const report = await db.insert(scheduledReports).values({
    teamId: teamId || null,
    userId,
    name,
    reportType,
    frequency,
    recipients: JSON.stringify(recipients),
    format,
    filters: filters ? JSON.stringify(filters) : null,
    isActive: true,
    nextSendAt,
  }).returning();

  return report[0];
}

/**
 * Create link approval request
 */
export async function createLinkApproval(params: {
  linkId: number;
  workflowId?: number;
  requestedBy: number;
}) {
  const { linkId, workflowId, requestedBy } = params;

  const approval = await db.insert(linkApprovals).values({
    linkId,
    workflowId: workflowId || null,
    requestedBy,
    status: 'pending',
  }).returning();

  // Log activity
  await logActivity({
    userId: requestedBy,
    activityType: 'link.approval.requested',
    title: 'Link approval requested',
    linkId,
  });

  return approval[0];
}

/**
 * Approve or reject a link
 */
export async function processLinkApproval(params: {
  approvalId: number;
  approvedBy: number;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}) {
  const { approvalId, approvedBy, status, rejectionReason } = params;

  const approval = await db.query.linkApprovals.findFirst({
    where: eq(linkApprovals.id, approvalId),
  });

  if (!approval) {
    throw new Error('Approval not found');
  }

  await db.update(linkApprovals)
    .set({
      status,
      approvedBy,
      rejectionReason: status === 'rejected' ? rejectionReason : null,
      approvedAt: new Date(),
    })
    .where(eq(linkApprovals.id, approvalId));

  // Log activity
  await logActivity({
    userId: approvedBy,
    activityType: `link.approval.${status}`,
    title: `Link ${status}`,
    linkId: approval.linkId,
  });

  return approval;
}

/**
 * Create link from template
 */
export async function createLinkFromTemplate(params: {
  templateId: number;
  userId: number;
  teamId?: number;
  customLongUrl?: string;
  customShortCode?: string;
}) {
  const { templateId, userId, teamId, customLongUrl, customShortCode } = params;

  const template = await db.query.linkTemplates.findFirst({
    where: eq(linkTemplates.id, templateId),
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Check if user has access to template
  if (!template.isPublic && template.userId !== userId) {
    if (teamId && template.teamId !== teamId) {
      throw new Error('Template not accessible');
    }
  }

  // Parse template data
  const defaultTags = template.defaultTags ? JSON.parse(template.defaultTags) : [];
  const defaultUtmParams = template.defaultUtmParams ? JSON.parse(template.defaultUtmParams) : {};

  // Create link (simplified - actual implementation would use your link creation logic)
  // This is a placeholder - you'd integrate with your actual link creation API

  // Increment template usage
  await db.update(linkTemplates)
    .set({ usageCount: sql`${linkTemplates.usageCount} + 1` })
    .where(eq(linkTemplates.id, templateId));

  return {
    template,
    defaultTags,
    defaultUtmParams,
  };
}

/**
 * Log audit event
 */
export async function logAuditEvent(params: {
  teamId?: number;
  userId?: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}) {
  const {
    teamId,
    userId,
    action,
    resourceType,
    resourceId,
    ipAddress,
    userAgent,
    changes,
    metadata,
  } = params;

  await db.insert(auditLogs).values({
    teamId: teamId || null,
    userId: userId || null,
    action,
    resourceType,
    resourceId: resourceId || null,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    changes: changes ? JSON.stringify(changes) : null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

/**
 * Log team activity
 */
export async function logActivity(params: {
  teamId?: number;
  userId?: number;
  activityType: string;
  title: string;
  description?: string;
  linkId?: number;
  metadata?: Record<string, any>;
}) {
  const { teamId, userId, activityType, title, description, linkId, metadata } = params;

  if (!teamId && !userId) {
    return; // Can't log without team or user
  }

  await db.insert(teamActivityFeed).values({
    teamId: teamId || 0, // Will be set from link if not provided
    userId: userId || null,
    activityType,
    title,
    description: description || null,
    linkId: linkId || null,
    metadata: metadata ? JSON.stringify(metadata) : null,
    isRead: false,
  });
}

/**
 * Archive a link
 */
export async function archiveLink(params: {
  linkId: number;
  archivedBy: number;
  archiveReason?: string;
  restoreAt?: Date;
}) {
  const { linkId, archivedBy, archiveReason, restoreAt } = params;

  const link = await db.query.links.findFirst({
    where: eq(links.id, linkId),
  });

  if (!link) {
    throw new Error('Link not found');
  }

  // Create archive record
  await db.insert(archivedLinks).values({
    originalLinkId: linkId,
    shortCode: link.shortCode,
    longUrl: link.longUrl,
    archivedBy,
    archiveReason: archiveReason || null,
    restoreAt: restoreAt || null,
    isRestored: false,
  });

  // Mark link as archived
  await db.update(links)
    .set({
      isArchived: true,
      archivedAt: new Date(),
    })
    .where(eq(links.id, linkId));

  // Log activity
  await logActivity({
    userId: archivedBy,
    activityType: 'link.archived',
    title: 'Link archived',
    linkId,
    metadata: { reason: archiveReason },
  });
}

/**
 * Restore archived link
 */
export async function restoreArchivedLink(params: {
  archiveId: number;
  restoredBy: number;
}) {
  const { archiveId, restoredBy } = params;

  const archive = await db.query.archivedLinks.findFirst({
    where: eq(archivedLinks.id, archiveId),
  });

  if (!archive || archive.isRestored) {
    throw new Error('Archive not found or already restored');
  }

  // Restore link
  await db.update(links)
    .set({
      isArchived: false,
      archivedAt: null,
    })
    .where(eq(links.id, archive.originalLinkId));

  // Mark archive as restored
  await db.update(archivedLinks)
    .set({ isRestored: true })
    .where(eq(archivedLinks.id, archiveId));

  // Log activity
  await logActivity({
    userId: restoredBy,
    activityType: 'link.restored',
    title: 'Link restored',
    linkId: archive.originalLinkId,
  });
}

/**
 * Get team activity feed
 */
export async function getTeamActivityFeed(teamId: number, limit: number = 50) {
  const activities = await db.query.teamActivityFeed.findMany({
    where: eq(teamActivityFeed.teamId, teamId),
    orderBy: [desc(teamActivityFeed.createdAt)],
    limit,
  });

  return activities;
}

/**
 * Mark activity as read
 */
export async function markActivityAsRead(activityId: number) {
  await db.update(teamActivityFeed)
    .set({ isRead: true })
    .where(eq(teamActivityFeed.id, activityId));
}
