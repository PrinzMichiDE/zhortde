import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

export const AdminAuditActions = {
  USER_DELETED: 'admin.user.deleted',
  BLOCKLIST_UPDATED: 'admin.blocklist.updated',
} as const;

export type AdminAuditAction = typeof AdminAuditActions[keyof typeof AdminAuditActions];

export async function logAdminAction(params: {
  adminUserId: number;
  action: AdminAuditAction;
  resourceType: string;
  resourceId?: number;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogs).values({
      userId: params.adminUserId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      ipAddress: params.ipAddress ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
