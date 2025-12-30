import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { ssoDomains, ssoDomainAdmins } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = parseInt(session.user.id);

  // Get domains owned by user
  const ownedDomains = await db.query.ssoDomains.findMany({
    where: eq(ssoDomains.userId, userId),
    with: {
      admins: {
        with: {
          user: true
        }
      }
    }
  });

  // Get domains where user is admin
  const adminDomains = await db.query.ssoDomainAdmins.findMany({
    where: eq(ssoDomainAdmins.userId, userId),
    with: {
      domain: {
        with: {
          admins: {
            with: {
              user: true
            }
          }
        }
      }
    }
  });

  const allDomains = [
    ...ownedDomains.map(d => ({ ...d, role: 'owner' })),
    ...adminDomains.map(ad => ({ ...ad.domain, role: 'admin' }))
  ];

  // Remove duplicates if any (shouldn't be, but good practice)
  const uniqueDomains = Array.from(new Map(allDomains.map(item => [item.id, item])).values());

  return NextResponse.json(uniqueDomains);
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
