import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getLinkPreview } from '@/lib/link-preview';

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

    // Get link
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Check permissions
    if (!link.isPublic && (!session || parseInt(session.user.id) !== link.userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get or fetch preview
    const preview = await getLinkPreview(link.id, link.longUrl);

    return NextResponse.json({
      success: true,
      preview: preview ? {
        title: preview.title,
        description: preview.description,
        imageUrl: preview.imageUrl,
        thumbnailUrl: preview.thumbnailUrl,
        siteName: preview.siteName,
        faviconUrl: preview.faviconUrl,
        ogData: preview.ogData ? JSON.parse(preview.ogData) : null,
      } : null,
    });
  } catch (error) {
    console.error('Preview fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    );
  }
}
