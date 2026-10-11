import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { customDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySslCertificate } from '@/lib/domain-verification';
import { logAuditEvent } from '@/lib/enterprise-features';

/**
 * POST /api/user/domains/[id]/verify-ssl
 *
 * Performs an SSL/TLS certificate check for the custom domain.
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

    if (!domainEntry.verified) {
      return NextResponse.json(
        { error: 'Domain must be DNS-verified before SSL check' },
        { status: 400 },
      );
    }

    const sslResult = await verifySslCertificate(domainEntry.domain);

    if (sslResult.valid) {
      await logAuditEvent(
        userId,
        'ssl_verified',
        { domain: domainEntry.domain },
        'success',
      );

      return NextResponse.json({
        message: 'SSL certificate valid',
        sslValid: true,
        expired: sslResult.expired,
        subject: sslResult.subject,
      });
    }

    await logAuditEvent(
      userId,
      'ssl_verification_failed',
      { domain: domainEntry.domain },
      'failure',
    );

    return NextResponse.json(
      {
        message: 'SSL certificate invalid or unreachable',
        sslValid: false,
      },
      { status: 422 },
    );
  } catch (error) {
    console.error('Error during SSL verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
