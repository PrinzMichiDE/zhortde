import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { webhooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateWebhookSecret } from '@/lib/webhooks';

/**
 * GET /api/user/webhooks - List user's webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.userId, parseInt(session.user.id)));

    // Parse events JSON for each webhook
    const formattedWebhooks = userWebhooks.map((webhook) => ({
      ...webhook,
      events: JSON.parse(webhook.events),
    }));

    return NextResponse.json({ webhooks: formattedWebhooks });
  } catch (error) {
    console.error('Webhooks GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/webhooks - Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, events } = body;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'At least one event is required' },
        { status: 400 }
      );
    }

    const secret = generateWebhookSecret();

    const [newWebhook] = await db
      .insert(webhooks)
      .values({
        userId: parseInt(session.user.id),
        url: url.trim(),
        secret,
        events: JSON.stringify(events),
        isActive: true,
      })
      .returning();

    return NextResponse.json(
      {
        webhook: {
          ...newWebhook,
          events: JSON.parse(newWebhook.events),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Webhooks POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

