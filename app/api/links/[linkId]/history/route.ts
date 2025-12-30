import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, linkHistory } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { linkId } = await params;
    const linkIdNum = parseInt(linkId, 10);
    const userId = parseInt(session.user.id);

    // Verify ownership
    const link = await db.query.links.findFirst({
      where: and(eq(links.id, linkIdNum), eq(links.userId, userId)),
    });

    if (!link) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get History
    const history = await db.query.linkHistory.findMany({
      where: eq(linkHistory.linkId, linkIdNum),
      orderBy: [desc(linkHistory.createdAt)],
      with: {
        user: {
          columns: {
            email: true,
          }
        }
      }
    });

    return NextResponse.json(history);

  } catch (error) {
    console.error('Error fetching link history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
