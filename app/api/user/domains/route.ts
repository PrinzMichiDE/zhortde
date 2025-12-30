import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { customDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Get all custom domains for user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const domains = await db.query.customDomains.findMany({
      where: eq(customDomains.userId, userId),
    });

    return NextResponse.json({ success: true, domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}

/**
 * Add a custom domain
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // Check if domain already exists
    const existing = await db.query.customDomains.findFirst({
      where: eq(customDomains.domain, domain),
    });

    if (existing) {
      return NextResponse.json({ error: 'Domain already in use' }, { status: 409 });
    }

    // Generate verification token for DNS
    const verificationToken = nanoid(32);
    const dnsRecords = JSON.stringify([
      {
        type: 'TXT',
        name: `_zhort-verify.${domain}`,
        value: verificationToken,
      },
      {
        type: 'CNAME',
        name: domain,
        value: 'zhort.vercel.app', // Or your main domain
      },
    ]);

    const [newDomain] = await db
      .insert(customDomains)
      .values({
        userId,
        domain,
        verified: false,
        dnsRecords,
        sslEnabled: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      domain: newDomain,
      dnsRecords: JSON.parse(dnsRecords),
      verificationToken,
    });
  } catch (error) {
    console.error('Error adding domain:', error);
    return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 });
  }
}

/**
 * Verify domain DNS records
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
    }

    const domain = await db.query.customDomains.findFirst({
      where: and(
        eq(customDomains.id, domainId),
        eq(customDomains.userId, userId)
      ),
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // In production, verify DNS records here
    // For now, mark as verified
    const [updated] = await db
      .update(customDomains)
      .set({
        verified: true,
        verifiedAt: new Date(),
        sslEnabled: true, // Auto-enable SSL (Vercel handles this)
      })
      .where(eq(customDomains.id, domainId))
      .returning();

    return NextResponse.json({ success: true, domain: updated });
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 });
  }
}

/**
 * Delete custom domain
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');

    if (!session || !domainId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const domain = await db.query.customDomains.findFirst({
      where: and(
        eq(customDomains.id, parseInt(domainId)),
        eq(customDomains.userId, userId)
      ),
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    await db
      .delete(customDomains)
      .where(eq(customDomains.id, parseInt(domainId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
  }
}
