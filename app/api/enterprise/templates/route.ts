import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { linkTemplates } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { z } from 'zod';

const templateSchema = z.object({
  teamId: z.number().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  longUrl: z.string().url(),
  shortCodePrefix: z.string().optional(),
  defaultTags: z.array(z.string()).optional(),
  defaultUtmParams: z.record(z.string(), z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    let templates;
    if (teamId) {
      templates = await db.query.linkTemplates.findMany({
        where: or(
          eq(linkTemplates.teamId, parseInt(teamId, 10)),
          eq(linkTemplates.isPublic, true)
        ),
        orderBy: (templates, { desc }) => [desc(templates.usageCount)],
      });
    } else {
      templates = await db.query.linkTemplates.findMany({
        where: or(
          eq(linkTemplates.userId, parseInt(session.user.id)),
          eq(linkTemplates.isPublic, true)
        ),
        orderBy: (templates, { desc }) => [desc(templates.usageCount)],
      });
    }

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
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
    const data = templateSchema.parse(body);

    const template = await db.insert(linkTemplates).values({
      teamId: data.teamId || null,
      userId: parseInt(session.user.id),
      name: data.name,
      description: data.description || null,
      longUrl: data.longUrl,
      shortCodePrefix: data.shortCodePrefix || null,
      defaultTags: data.defaultTags ? JSON.stringify(data.defaultTags) : null,
      defaultUtmParams: data.defaultUtmParams ? JSON.stringify(data.defaultUtmParams) : null,
      isPublic: data.isPublic || false,
      usageCount: 0,
    }).returning();

    return NextResponse.json({
      success: true,
      template: template[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Template create error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
