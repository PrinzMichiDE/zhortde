import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { customDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  verifyDnsTxtRecord,
  verifyDnsCnameRecord,
} from '@/lib/domain-verification';
import { logAuditEvent } from '@/lib/enterprise-features';

/**
 * POST /api/user/domains/[id]/verify-dns
 *
 * Validates that the required DNS records (TXT / CNAME) are correctly
 * configured for the given custom domain.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const domainId = parseInt(id, 10);
    if (isNaN(domainId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    const domain = await db
      .select()
      .from(customDomains)
      .where(
        and(eq(customDomains.id, domainId), eq(customDomains.userId, userId)),
      )
      .limit(1);

    if (domain.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 },
      );
    }

    const domainEntry = domain[0];

    // If already verified, return early.
    if (domainEntry.verified) {
      return NextResponse.json({
        message: 'Domain is already verified',
        verified: true,
      });
    }

    const dnsRecords = domainEntry.dnsRecords
      ? JSON.parse(domainEntry.dnsRecords as string)
      : null;

    if (!dnsRecords) {
      return NextResponse.json(
        { error: 'No DNS records configured for this domain' },
        { status: 400 },
      );
    }

    let verified = false;
    let failedChecks: string[] = [];

    // Validate TXT record.
    if (dnsRecords.type === 'TXT' || dnsRecords.type === 'text') {
      verified = await verifyDnsTxtRecord(
        dnsRecords.name,
        dnsRecords.value,
      );
      if (!verified) {
        failedChecks.push(
          `TXT record on ${dnsRecords.name} not found or incorrect`,
        );
      }
    }

    // Validate CNAME record.
    if (dnsRecords.type === 'CNAME' || dnsRecords.type === 'cname') {
      // Derive verification hostname: put the record name under the domain.
      const verificationHostname = `${dnsRecords.name}.${domainEntry.domain}`;
      verified = await verifyDnsCnameRecord(
        verificationHostname,
        dnsRecords.value,
      );
      if (!verified) {
        failedChecks.push(
          `CNAME record on ${verificationHostname} not found or incorrect`,
        );
      }
    }

    // If neither TXT nor CNAME was matched, treat as error.
    if (!verified && failedChecks.length === 0) {
      failedChecks.push('Unsupported DNS record type');
    }

    if (verified) {
      await db
        .update(customDomains)
        .set({ verified: true, verifiedAt: new Date() })
        .where(and(eq(customDomains.id, domainId), eq(customDomains.userId, userId)));

      await logAuditEvent(
        userId,
        'domain_verified',
        { domain: domainEntry.domain },
        'success',
      );

      return NextResponse.json({
        message: 'Domain verified successfully',
        verified: true,
      });
    }

    return NextResponse.json(
      {
        message: 'DNS verification failed',
        verified: false,
        failedChecks,
      },
      { status: 422 },
    );
  } catch (error) {
    console.error('Error during DNS verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/user/domains/[id]/verify-dns
 *
 * Returns the configured DNS records for this domain so the client
 * can display setup instructions to the user.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const domainId = parseInt(id, 10);
    if (isNaN(domainId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    const domain = await db
      .select()
      .from(customDomains)
      .where(
        and(eq(customDomains.id, domainId), eq(customDomains.userId, userId)),
      )
      .limit(1);

    if (domain.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 },
      );
    }

    const domainEntry = domain[0];

    return NextResponse.json({
      dnsRecords: domainEntry.dnsRecords
        ? JSON.parse(domainEntry.dnsRecords as string)
        : null,
      verified: domainEntry.verified,
      verifiedAt: domainEntry.verifiedAt,
    });
  } catch (error) {
    console.error('Error fetching DNS records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
