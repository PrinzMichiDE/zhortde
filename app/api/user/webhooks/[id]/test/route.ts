import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { webhooks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * POST /api/user/webhooks/[id]/test - Send a test webhook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const webhookId = parseInt(id, 10);

    if (isNaN(webhookId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Get webhook
    const webhook = await db.query.webhooks.findFirst({
      where: and(
        eq(webhooks.id, webhookId),
        eq(webhooks.userId, parseInt(session.user.id))
      ),
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Create test payload
    const payload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Zhort',
        webhookId: webhook.id,
      },
    };

    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payloadString)
      .digest('hex');

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Zhort-Signature': signature,
        'X-Zhort-Event': 'webhook.test',
        'User-Agent': 'Zhort-Webhooks/1.0',
      },
      body: payloadString,
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Test webhook sent successfully',
        status: response.status,
      });
    } else {
      return NextResponse.json(
        {
          error: 'Webhook endpoint returned an error',
          status: response.status,
          statusText: response.statusText,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { error: 'Failed to send test webhook: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

