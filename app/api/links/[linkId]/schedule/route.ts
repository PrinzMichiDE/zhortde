import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getLinkSchedules, createSchedule, updateSchedule, deleteSchedule } from '@/lib/link-scheduling';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkIdNum = parseInt(linkId);
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schedules = await getLinkSchedules(linkIdNum);

    return NextResponse.json({ success: true, schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkIdNum = parseInt(linkId);
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const schedule = await createSchedule(linkIdNum, {
      activeFrom: body.activeFrom ? new Date(body.activeFrom) : undefined,
      activeUntil: body.activeUntil ? new Date(body.activeUntil) : undefined,
      timezone: body.timezone,
      fallbackUrl: body.fallbackUrl,
    });

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!session || !scheduleId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkIdNum = parseInt(linkId);
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await deleteSchedule(parseInt(scheduleId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
