import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { ssoDomains, ssoDomainAdmins } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Update Config
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt((await params).id);
  const body = await request.json();
  const userId = parseInt(session.user.id);

  // Check Permissions (Owner OR Admin)
  const domain = await db.query.ssoDomains.findFirst({
    where: eq(ssoDomains.id, id),
  });

  if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

  let hasPermission = domain.userId === userId;

  if (!hasPermission) {
    const adminRecord = await db.query.ssoDomainAdmins.findFirst({
      where: and(
        eq(ssoDomainAdmins.domainId, id),
        eq(ssoDomainAdmins.userId, userId)
      ),
    });
    if (adminRecord) hasPermission = true;
  }

  if (!hasPermission) {
    return NextResponse.json({ error: 'Unauthorized to edit this domain' }, { status: 403 });
  }

  // Update fields
  const { clientId, clientSecret, tenantId, issuerUrl, authorizationUrl, tokenUrl, userInfoUrl } = body;
  
  await db.update(ssoDomains)
    .set({
      clientId,
      clientSecret,
      tenantId,
      issuerUrl,
      authorizationUrl,
      tokenUrl,
      userInfoUrl,
      updatedAt: new Date(),
    })
    .where(eq(ssoDomains.id, id));

  return NextResponse.json({ success: true });
}

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
