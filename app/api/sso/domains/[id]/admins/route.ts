import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { ssoDomains, ssoDomainAdmins, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Add Admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const domainId = parseInt((await params).id);
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Verify ownership (Only Owner can add admins)
  const domain = await db.query.ssoDomains.findFirst({
    where: eq(ssoDomains.id, domainId),
  });

  if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

  if (domain.userId !== parseInt(session.user.id)) {
    return NextResponse.json({ error: 'Only the domain owner can add admins' }, { status: 403 });
  }

  // Find user by email
  const targetUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found. They must register first.' }, { status: 404 });
  }

  // Ensure user email matches domain (optional but good for security? User requirement: "Nutzer seiner Domains")
  // Let's implement this check: only allow adding admins who have an email ending in the domain.
  if (!email.endsWith(`@${domain.domain}`)) {
    return NextResponse.json({ error: `User must have an email address ending in @${domain.domain}` }, { status: 400 });
  }

  // Check if already admin or owner
  if (targetUser.id === domain.userId) {
    return NextResponse.json({ error: 'User is already the owner' }, { status: 400 });
  }

  const existingAdmin = await db.query.ssoDomainAdmins.findFirst({
    where: and(
      eq(ssoDomainAdmins.domainId, domainId),
      eq(ssoDomainAdmins.userId, targetUser.id)
    ),
  });

  if (existingAdmin) {
    return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
  }

  await db.insert(ssoDomainAdmins).values({
    domainId,
    userId: targetUser.id,
  });

  return NextResponse.json({ success: true });
}

// Remove Admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const domainId = parseInt((await params).id);
  const searchParams = request.nextUrl.searchParams;
  const targetUserId = parseInt(searchParams.get('userId') || '0');

  if (!targetUserId) {
    return NextResponse.json({ error: 'Target User ID required' }, { status: 400 });
  }

  // Verify ownership
  const domain = await db.query.ssoDomains.findFirst({
    where: eq(ssoDomains.id, domainId),
  });

  if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

  if (domain.userId !== parseInt(session.user.id)) {
    return NextResponse.json({ error: 'Only the domain owner can remove admins' }, { status: 403 });
  }

  await db.delete(ssoDomainAdmins).where(
    and(
      eq(ssoDomainAdmins.domainId, domainId),
      eq(ssoDomainAdmins.userId, targetUserId)
    )
  );

  return NextResponse.json({ success: true });
}
