import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkTeamQuota } from '@/lib/enterprise';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    const teamIdNum = parseInt(teamId, 10);
    if (isNaN(teamIdNum)) {
      return NextResponse.json({ error: 'Invalid Team ID' }, { status: 400 });
    }

    // Verify user is member of team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamIdNum),
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const quota = await checkTeamQuota(teamIdNum);

    return NextResponse.json({
      success: true,
      quota,
    });
  } catch (error) {
    console.error('Quota check error:', error);
    return NextResponse.json(
      { error: 'Failed to check quota' },
      { status: 500 }
    );
  }
}
