import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { checkTeamQuota } from '@/lib/enterprise';
import { assertTeamMembership } from '@/lib/enterprise-team-access';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (Number.isNaN(userId)) {
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

    const access = await assertTeamMembership(userId, teamIdNum);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
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
