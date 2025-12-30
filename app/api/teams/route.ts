import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { teams, teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(50, 'Name darf maximal 50 Zeichen lang sein'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Fetch teams where user is a member or owner
    // This requires a join. Drizzle query builder handles relations nicely.
    
    // 1. Get all memberships for the user
    const memberships = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, userId),
      with: {
        team: {
          with: {
            members: true, // to count members
          }
        }
      }
    });

    // 2. Map to simplified structure
    const teamsList = memberships.map(m => ({
      id: m.team.id,
      name: m.team.name,
      role: m.role,
      memberCount: m.team.members.length,
      createdAt: m.team.createdAt,
    }));

    return NextResponse.json(teamsList);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    // Validate input
    const validation = createTeamSchema.safeParse(body);
    if (!validation.success) {
      // Use issues instead of errors, safer access
      const errorMessage = validation.error.issues[0]?.message || 'Ungültige Eingabe';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { name } = validation.data;

    // Transaction: Create Team -> Add Owner as Member
    const result = await db.transaction(async (tx) => {
      // 1. Create Team
      const [newTeam] = await tx.insert(teams).values({
        name,
        ownerId: userId,
      }).returning();

      // 2. Add User as Owner-Member
      await tx.insert(teamMembers).values({
        teamId: newTeam.id,
        userId: userId,
        role: 'owner',
        permissions: JSON.stringify(['admin', 'manage_members', 'billing']), // Default owner permissions
      });

      return newTeam;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
