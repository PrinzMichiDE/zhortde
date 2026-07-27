import { db } from './db';
import { teamActivityFeed, teamMembers, teams } from './db/schema';
import { and, eq } from 'drizzle-orm';

export type TeamAccessResult =
  | { allowed: true }
  | { allowed: false; status: 403 | 404; error: string };

export async function assertTeamMembership(
  userId: number,
  teamId: number,
): Promise<TeamAccessResult> {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return { allowed: false, status: 404, error: 'Team not found' };
  }

  if (team.ownerId === userId) {
    return { allowed: true };
  }

  const member = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.userId, userId),
      eq(teamMembers.teamId, teamId),
    ),
  });

  if (!member) {
    return { allowed: false, status: 403, error: 'Forbidden' };
  }

  return { allowed: true };
}

export async function assertActivityTeamMembership(
  userId: number,
  activityId: number,
): Promise<TeamAccessResult> {
  const activity = await db.query.teamActivityFeed.findFirst({
    where: eq(teamActivityFeed.id, activityId),
  });

  if (!activity) {
    return { allowed: false, status: 404, error: 'Activity not found' };
  }

  return assertTeamMembership(userId, activity.teamId);
}
