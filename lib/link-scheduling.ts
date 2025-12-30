import { db } from './db';
import { linkSchedules, links } from './db/schema';
import { eq, and, or, lte, gte } from 'drizzle-orm';

/**
 * Check if a link is currently active based on schedule
 */
export async function isLinkScheduled(linkId: number): Promise<{
  isActive: boolean;
  fallbackUrl?: string;
  schedule?: typeof linkSchedules.$inferSelect;
}> {
  const now = new Date();
  
  const schedule = await db.query.linkSchedules.findFirst({
    where: and(
      eq(linkSchedules.linkId, linkId),
      eq(linkSchedules.isActive, true)
    ),
  });

  if (!schedule) {
    return { isActive: true }; // No schedule = always active
  }

  // Check if we're within the scheduled time window
  const activeFrom = schedule.activeFrom ? new Date(schedule.activeFrom) : null;
  const activeUntil = schedule.activeUntil ? new Date(schedule.activeUntil) : null;

  let isActive = true;

  if (activeFrom && now < activeFrom) {
    isActive = false; // Not started yet
  }

  if (activeUntil && now > activeUntil) {
    isActive = false; // Already expired
  }

  return {
    isActive,
    fallbackUrl: schedule.fallbackUrl || undefined,
    schedule,
  };
}

/**
 * Get all active schedules for a link
 */
export async function getLinkSchedules(linkId: number) {
  return await db.query.linkSchedules.findMany({
    where: eq(linkSchedules.linkId, linkId),
    orderBy: [linkSchedules.activeFrom],
  });
}

/**
 * Create a schedule for a link
 */
export async function createSchedule(
  linkId: number,
  schedule: {
    activeFrom?: Date;
    activeUntil?: Date;
    timezone?: string;
    fallbackUrl?: string;
  }
) {
  const [newSchedule] = await db
    .insert(linkSchedules)
    .values({
      linkId,
      activeFrom: schedule.activeFrom,
      activeUntil: schedule.activeUntil,
      timezone: schedule.timezone || 'UTC',
      fallbackUrl: schedule.fallbackUrl,
      isActive: true,
    })
    .returning();

  return newSchedule;
}

/**
 * Update schedule
 */
export async function updateSchedule(
  scheduleId: number,
  updates: {
    activeFrom?: Date;
    activeUntil?: Date;
    timezone?: string;
    fallbackUrl?: string;
    isActive?: boolean;
  }
) {
  const [updated] = await db
    .update(linkSchedules)
    .set(updates)
    .where(eq(linkSchedules.id, scheduleId))
    .returning();

  return updated;
}

/**
 * Delete schedule
 */
export async function deleteSchedule(scheduleId: number) {
  await db
    .delete(linkSchedules)
    .where(eq(linkSchedules.id, scheduleId));
}
