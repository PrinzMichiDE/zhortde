import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, trackingPixels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    const pixels = await db.query.trackingPixels.findMany({
      where: eq(trackingPixels.linkId, linkIdNum),
    });

    return NextResponse.json({ success: true, pixels });
  } catch (error) {
    console.error('Error fetching pixels:', error);
    return NextResponse.json({ error: 'Failed to fetch pixels' }, { status: 500 });
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
    const { pixelType, pixelId, events } = body;

    if (!pixelType || !pixelId) {
      return NextResponse.json({ error: 'pixelType and pixelId are required' }, { status: 400 });
    }

    const [pixel] = await db
      .insert(trackingPixels)
      .values({
        linkId: linkIdNum,
        pixelType,
        pixelId,
        events: events ? JSON.stringify(events) : JSON.stringify(['pageview']),
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, pixel });
  } catch (error) {
    console.error('Error creating pixel:', error);
    return NextResponse.json({ error: 'Failed to create pixel' }, { status: 500 });
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
    const pixelId = searchParams.get('pixelId');

    if (!session || !pixelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkIdNum = parseInt(linkId);
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db
      .delete(trackingPixels)
      .where(eq(trackingPixels.id, parseInt(pixelId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pixel:', error);
    return NextResponse.json({ error: 'Failed to delete pixel' }, { status: 500 });
  }
}
