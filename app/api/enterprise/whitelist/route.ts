import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { ipWhitelist, teams } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const ipWhitelistSchema = z.object({
  teamId: z.number().optional(),
  ipAddress: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    const conditions = [];
    if (teamId) {
      const teamIdNum = parseInt(teamId, 10);
      if (!isNaN(teamIdNum)) {
        conditions.push(eq(ipWhitelist.teamId, teamIdNum));
      }
    } else {
      conditions.push(eq(ipWhitelist.userId, parseInt(session.user.id)));
    }

    const entries = await db.query.ipWhitelist.findMany({
      where: and(...conditions),
      orderBy: (ipWhitelist, { desc }) => [desc(ipWhitelist.createdAt)],
    });

    return NextResponse.json({
      success: true,
      entries,
    });
  } catch (error) {
    console.error('Whitelist fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch whitelist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = ipWhitelistSchema.parse(body);

    // Verify team ownership if teamId provided
    if (data.teamId) {
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, data.teamId),
      });

      if (!team || team.ownerId !== parseInt(session.user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const entry = await db.insert(ipWhitelist).values({
      teamId: data.teamId || null,
      userId: data.teamId ? null : parseInt(session.user.id),
      ipAddress: data.ipAddress,
      description: data.description || null,
      isActive: true,
    }).returning();

    return NextResponse.json({
      success: true,
      entry: entry[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Whitelist create error:', error);
    return NextResponse.json(
      { error: 'Failed to create whitelist entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verify ownership
    const entry = await db.query.ipWhitelist.findFirst({
      where: eq(ipWhitelist.id, idNum),
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (entry.teamId) {
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, entry.teamId),
      });
      if (!team || team.ownerId !== parseInt(session.user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (entry.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(ipWhitelist).where(eq(ipWhitelist.id, idNum));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Whitelist delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete whitelist entry' },
      { status: 500 }
    );
  }
}
