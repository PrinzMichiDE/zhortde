import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { teams, teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;
    const teamIdNum = parseInt(teamId, 10);
    const userId = parseInt(session.user.id);

    // Verify membership
    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, teamIdNum), eq(teamMembers.userId, userId)),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamIdNum),
      with: {
        owner: {
          columns: {
            email: true,
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...team,
      currentUserRole: membership.role,
    });

  } catch (error) {
    console.error('Error fetching team details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
