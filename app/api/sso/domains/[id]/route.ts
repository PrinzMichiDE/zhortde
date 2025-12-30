import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { ssoDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt((await params).id);

  await db.delete(ssoDomains).where(
    and(
      eq(ssoDomains.id, id),
      eq(ssoDomains.userId, parseInt(session.user.id))
    )
  );

  return NextResponse.json({ success: true });
}
