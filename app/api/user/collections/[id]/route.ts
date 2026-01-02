import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { linkCollections, links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { removeLinkFromCollection } from '@/lib/user-features';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const collectionId = parseInt(id, 10);

    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    // Verify ownership
    const collection = await db.query.linkCollections.findFirst({
      where: eq(linkCollections.id, collectionId),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove all links from collection first
    const collectionLinks = await db.query.links.findMany({
      where: eq(links.collectionId, collectionId),
    });

    for (const link of collectionLinks) {
      await removeLinkFromCollection(link.id);
    }

    // Delete collection
    await db.delete(linkCollections).where(eq(linkCollections.id, collectionId));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Collection delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
