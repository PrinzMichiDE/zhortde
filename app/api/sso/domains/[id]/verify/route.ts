import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { ssoDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { resolveTxt } from 'dns/promises';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt((await params).id);
  const domainRecord = await db.query.ssoDomains.findFirst({
    where: and(
      eq(ssoDomains.id, id),
      eq(ssoDomains.userId, parseInt(session.user.id))
    ),
  });

  if (!domainRecord) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
  }

  try {
    // Check TXT record
    // We look for _zhort-challenge.<domain> or just <domain>
    // Let's try root domain first, and maybe subdomain `_zhort-challenge`
    
    // User instruction implied "claim domain (TXT verification)".
    // Standard practice: TXT on root or specific subdomain.
    // Let's check both `domain` and `_zhort-challenge.${domain}`
    
    let verified = false;
    const token = domainRecord.verificationToken;

    const checkDns = async (hostname: string) => {
      try {
        const records = await resolveTxt(hostname);
        // records is string[][]
        return records.some(chunk => chunk.join('').includes(token));
      } catch (e) {
        return false;
      }
    };

    if (await checkDns(domainRecord.domain)) verified = true;
    if (!verified && await checkDns(`_zhort-challenge.${domainRecord.domain}`)) verified = true;

    if (verified) {
      await db.update(ssoDomains)
        .set({ isVerified: true })
        .where(eq(ssoDomains.id, id));
        
      return NextResponse.json({ success: true, verified: true });
    } else {
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        message: `TXT record not found. Please add "${token}" to your DNS records for ${domainRecord.domain}` 
      });
    }

  } catch (error) {
    console.error('DNS verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
