import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { linkApprovals, approvalWorkflows } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createLinkApproval, processLinkApproval } from '@/lib/enterprise-features';

const approvalSchema = z.object({
  linkId: z.number(),
  workflowId: z.number().optional(),
});

const processSchema = z.object({
  approvalId: z.number(),
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');

    const conditions = [];
    if (status) {
      conditions.push(eq(linkApprovals.status, status));
    }

    const approvals = await db.query.linkApprovals.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      orderBy: (approvals, { desc }) => [desc(approvals.requestedAt)],
    });

    return NextResponse.json({
      success: true,
      approvals,
    });
  } catch (error) {
    console.error('Approvals fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if it's a create or process request
    if (body.approvalId) {
      // Process approval
      const data = processSchema.parse(body);
      const approval = await processLinkApproval({
        ...data,
        approvedBy: parseInt(session.user.id),
      });

      return NextResponse.json({
        success: true,
        approval,
      });
    } else {
      // Create approval
      const data = approvalSchema.parse(body);
      const approval = await createLinkApproval({
        ...data,
        requestedBy: parseInt(session.user.id),
      });

      return NextResponse.json({
        success: true,
        approval,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
