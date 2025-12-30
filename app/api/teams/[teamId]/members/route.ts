import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { teamMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

// GET: List members of a team
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

    // List members
    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, teamIdNum),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(members.map(m => ({
      userId: m.userId,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    })));

  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a member to a team
export async function POST(
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

    // Verify membership and permissions (only owner/admin can invite)
    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, teamIdNum), eq(teamMembers.userId, userId)),
    });

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = inviteMemberSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { email, role } = validation.data;

    // Find user by email
    const userToAdd = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already member
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, teamIdNum), eq(teamMembers.userId, userToAdd.id)),
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    // Add member
    await db.insert(teamMembers).values({
      teamId: teamIdNum,
      userId: userToAdd.id,
      role,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
