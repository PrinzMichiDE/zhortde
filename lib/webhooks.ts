import crypto from 'crypto';
import { db } from './db';
import { webhooks } from './db/schema';
import { eq } from 'drizzle-orm';

export type WebhookEvent = 'link.created' | 'link.clicked' | 'link.expired' | 'paste.created';

/**
 * Webhook data types for type safety
 */
export type WebhookLinkData = {
  linkId: number;
  shortCode: string;
  longUrl: string;
  ipAddress?: string;
  userAgent?: string | null;
  referer?: string | null;
};

export type WebhookPasteData = {
  pasteId: number;
  slug: string;
};

export type WebhookData = WebhookLinkData | WebhookPasteData | Record<string, unknown>;

export type WebhookPayload = {
  event: WebhookEvent;
  timestamp: string;
  data: WebhookData;
};

/**
 * Delivery guarantees.
 */
export const WEBHOOK_MAX_ATTEMPTS = 3;
export const WEBHOOK_BASE_DELAY_MS = 500;

/**
 * Build the signed webhook payload. Kept pure so it can be unit-tested.
 */
export function buildWebhookPayload(event: WebhookEvent, data: WebhookData): WebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deliver a single webhook with exponential backoff retries.
 *
 * Returns `true` when the endpoint acknowledged the delivery with a 2xx
 * response, `false` after all attempts were exhausted.
 */
export async function deliverWebhook(
  webhook: { id: number; url: string; secret: string; event: WebhookEvent },
  payload: WebhookPayload
): Promise<boolean> {
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, webhook.secret);

  for (let attempt = 1; attempt <= WEBHOOK_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Zhort-Signature': signature,
          'X-Zhort-Event': webhook.event,
          'User-Agent': 'Zhort-Webhooks/1.0',
        },
        body: payloadString,
      });

      if (response.ok) {
        return true;
      }

      console.error(
        `Webhook ${webhook.id} failed (attempt ${attempt}/${WEBHOOK_MAX_ATTEMPTS}): ` +
        `${response.status} ${response.statusText}`
      );
    } catch (error) {
      console.error(
        `Webhook ${webhook.id} error (attempt ${attempt}/${WEBHOOK_MAX_ATTEMPTS}):`,
        error
      );
    }

    // Exponential backoff with slight jitter between attempts
    if (attempt < WEBHOOK_MAX_ATTEMPTS) {
      const baseDelay = WEBHOOK_BASE_DELAY_MS * 2 ** (attempt - 1);
      const jitter = Math.floor(Math.random() * 0.2 * baseDelay);
      await sleep(baseDelay + jitter);
    }
  }

  return false;
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(userId: number, event: WebhookEvent, data: WebhookData) {
  try {
    // Find all active webhooks for this user that subscribe to this event
    const userWebhooks = await db.query.webhooks.findMany({
      where: eq(webhooks.userId, userId),
    });

    const relevantWebhooks = userWebhooks.filter((webhook: typeof webhooks.$inferSelect) => {
      if (!webhook.isActive) return false;
      
      try {
        const events = JSON.parse(webhook.events) as string[];
        return events.includes(event);
      } catch {
        return false;
      }
    });

    if (relevantWebhooks.length === 0) {
      return;
    }

    // Build the payload once and deliver to all subscribers with retries
    const payload = buildWebhookPayload(event, data);

    const promises = relevantWebhooks.map(async (webhook: typeof webhooks.$inferSelect) => {
      const delivered = await deliverWebhook(
        { id: webhook.id, url: webhook.url, secret: webhook.secret, event },
        payload
      );

      if (delivered) {
        // Update last triggered timestamp
        await db
          .update(webhooks)
          .set({ lastTriggeredAt: new Date() })
          .where(eq(webhooks.id, webhook.id));
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Webhook trigger error:', error);
  }
}

/**
 * Verify webhook signature (for testing)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);

  // `timingSafeEqual` throws when the buffers differ in length, which would
  // leak timing information to a malformed request. Guard the lengths first.
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(provided, expected);
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}