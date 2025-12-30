import { db } from '@/lib/db';
import { linkHistory } from '@/lib/db/schema';

export async function logLinkAction(
  linkId: number,
  userId: number | null,
  action: string,
  changes?: Record<string, any>
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
