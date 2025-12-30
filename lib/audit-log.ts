import { db } from '@/lib/db';
import { linkHistory } from '@/lib/db/schema';

/**
 * Type for audit log changes
 */
export type AuditLogChanges = Record<string, string | number | boolean | null | undefined | Record<string, unknown>>;

/**
 * Log a link action for audit trail
 */
export async function logLinkAction(
  linkId: number,
  userId: number | null,
  action: string,
  changes?: AuditLogChanges
) {
  try {
    await db.insert(linkHistory).values({
      linkId,
      userId,
      action,
      changes: changes ? JSON.stringify(changes) : null,
    });
  } catch (error) {
    console.error('Failed to log link action:', error);
    // Audit logging should not block the main action, so we swallow the error
  }
}

/**
 * Audit log action types
 */
export const AuditActions = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  TAGGED: 'tagged',
  PASSWORD_ADDED: 'password_added',
  PASSWORD_REMOVED: 'password_removed',
  EXPIRED: 'expired',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];
