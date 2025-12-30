import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, linkTags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { addTagToLink, removeTagFromLink, updateTagColor, getLinkTags } from '@/lib/link-tags';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await getServerSession(authOptions);
    
    const linkIdNum = parseInt(linkId);
    if (isNaN(linkIdNum)) {
      return NextResponse.json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    if (!link.isPublic && (!session || parseInt(session.user.id) !== link.userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tags = await getLinkTags(linkIdNum);

    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
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
    if (isNaN(linkIdNum)) {
      return NextResponse.json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { tag, color } = body;

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
    }

    const newTag = await addTagToLink(linkIdNum, tag.trim(), color);

    return NextResponse.json({ success: true, tag: newTag });
  } catch (error) {
    console.error('Error adding tag:', error);
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 });
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 });
    }

    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await removeTagFromLink(linkIdNum, parseInt(tagId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tag:', error);
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await request.json();
    const { tagId, color } = body;

    if (!tagId || !color) {
      return NextResponse.json({ error: 'tagId and color are required' }, { status: 400 });
    }

    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updated = await updateTagColor(tagId, color);

    return NextResponse.json({ success: true, tag: updated });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}
