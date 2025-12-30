import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { ssoDomains } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const domains = await db.query.ssoDomains.findMany({
    where: eq(ssoDomains.userId, parseInt(session.user.id)),
  });

  return NextResponse.json(domains);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { domain, providerType, clientId, clientSecret, issuerUrl, tenantId } = body;

  if (!domain || !providerType) {
    return NextResponse.json({ error: 'Domain and provider type are required' }, { status: 400 });
  }

  // Check if domain exists
  const existing = await db.query.ssoDomains.findFirst({
    where: eq(ssoDomains.domain, domain),
  });

  if (existing) {
    return NextResponse.json({ error: 'Domain already registered' }, { status: 400 });
  }

  const verificationToken = `zhort-verify=${nanoid(32)}`;

  const [newDomain] = await db.insert(ssoDomains).values({
    userId: parseInt(session.user.id),
    domain,
    verificationToken,
    providerType,
    clientId,
    clientSecret,
    issuerUrl,
    tenantId,
    isVerified: false,
  }).returning();

  return NextResponse.json(newDomain);
}
