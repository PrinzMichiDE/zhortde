import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { archivedLinks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { archiveLink, restoreArchivedLink } from '@/lib/enterprise-features';

const archiveSchema = z.object({
  linkId: z.number(),
  archiveReason: z.string().optional(),
  restoreAt: z.string().optional(), // ISO date string
});

const restoreSchema = z.object({
  archiveId: z.number(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const includeRestored = searchParams.get('includeRestored') === 'true';

    const conditions = [];
    if (!includeRestored) {
      conditions.push(eq(archivedLinks.isRestored, false));
    }

    const archives = await db.query.archivedLinks.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      orderBy: (archives, { desc }) => [desc(archives.archivedAt)],
    });

    return NextResponse.json({
      success: true,
      archives,
    });
  } catch (error) {
    console.error('Archive fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archives' },
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
    
    // Check if it's restore request
    if (body.archiveId) {
      const data = restoreSchema.parse(body);
      await restoreArchivedLink({
        ...data,
        restoredBy: parseInt(session.user.id),
      });

      return NextResponse.json({
        success: true,
      });
    } else {
      // Archive request
      const data = archiveSchema.parse(body);
      await archiveLink({
        ...data,
        archivedBy: parseInt(session.user.id),
        restoreAt: data.restoreAt ? new Date(data.restoreAt) : undefined,
      });

      return NextResponse.json({
        success: true,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Archive error:', error);
    return NextResponse.json(
      { error: 'Failed to process archive' },
      { status: 500 }
    );
  }
}
