import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { webhooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateWebhookSecret } from '@/lib/webhooks';
import {
  requireAuth,
  validateBody,
  webhookSchema,
  secureResponse,
  secureErrorResponse,
  ApiErrors,
  handleApiError,
} from '@/lib/api-security';

/**
 * GET /api/user/webhooks - List user's webhooks
 */
export async function GET() {
  try {
    // 1. Require authentication
    const auth = await requireAuth();
    if (!auth) {
      return secureErrorResponse(ApiErrors.UNAUTHORIZED);
    }

    // 2. Fetch user's webhooks
    const userWebhooks = await db
      .select({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        isActive: webhooks.isActive,
        lastTriggeredAt: webhooks.lastTriggeredAt,
        createdAt: webhooks.createdAt,
        // Note: Don't expose 'secret' in list response
      })
      .from(webhooks)
      .where(eq(webhooks.userId, auth.userId));

    // 3. Parse events JSON for each webhook
    const formattedWebhooks = userWebhooks.map((webhook) => ({
      ...webhook,
      events: JSON.parse(webhook.events),
    }));

    return secureResponse({ webhooks: formattedWebhooks });
  } catch (error) {
    return handleApiError(error, 'webhooks/GET');
  }
}

/**
 * POST /api/user/webhooks - Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Require authentication
    const auth = await requireAuth();
    if (!auth) {
      return secureErrorResponse(ApiErrors.UNAUTHORIZED);
    }

    // 2. Validate request body
    const validation = await validateBody(request, webhookSchema);
    if (!validation.success) {
      return secureErrorResponse(ApiErrors.VALIDATION_ERROR(validation.error));
    }

    const { url, events } = validation.data;

    // 3. Check webhook limit (max 10 per user)
    const existingCount = await db
      .select({ id: webhooks.id })
      .from(webhooks)
      .where(eq(webhooks.userId, auth.userId));
    
    if (existingCount.length >= 10) {
      return secureErrorResponse(
        ApiErrors.VALIDATION_ERROR('Maximum 10 webhooks allowed per user')
      );
    }

    // 4. Generate secure webhook secret
    const secret = generateWebhookSecret();

    // 5. Create webhook
    const [newWebhook] = await db
      .insert(webhooks)
      .values({
        userId: auth.userId,
        url: url.trim(),
        secret,
        events: JSON.stringify(events),
        isActive: true,
      })
      .returning();

    return secureResponse(
      {
        webhook: {
          id: newWebhook.id,
          url: newWebhook.url,
          events: JSON.parse(newWebhook.events),
          secret: newWebhook.secret, // Only show secret on creation
          isActive: newWebhook.isActive,
          createdAt: newWebhook.createdAt,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'webhooks/POST');
  }
}

