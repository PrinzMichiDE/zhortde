import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { scheduledReports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createScheduledReport } from '@/lib/enterprise-features';

const reportSchema = z.object({
  teamId: z.number().optional(),
  name: z.string().min(1),
  reportType: z.enum(['analytics', 'usage', 'compliance', 'custom']),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  recipients: z.array(z.string()).optional(), // Optional - stored but not used for email sending
  format: z.enum(['pdf', 'csv', 'json', 'html']).optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    const conditions = [];
    if (teamId) {
      conditions.push(eq(scheduledReports.teamId, parseInt(teamId, 10)));
    } else {
      conditions.push(eq(scheduledReports.userId, parseInt(session.user.id)));
    }

    const reports = await db.query.scheduledReports.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      orderBy: (reports, { desc }) => [desc(reports.createdAt)],
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
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
    const data = reportSchema.parse(body);

    const report = await createScheduledReport({
      ...data,
      userId: parseInt(session.user.id),
      recipients: data.recipients || [], // Optional recipients - stored but not used for email sending
    });

    return NextResponse.json({
      success: true,
      report,
      note: 'Reports are generated and stored. No emails are sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Report create error:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
