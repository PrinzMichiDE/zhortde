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
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
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

    const relevantWebhooks = userWebhooks.filter((webhook) => {
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

    // Trigger webhooks in parallel
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const promises = relevantWebhooks.map(async (webhook) => {
      try {
        const payloadString = JSON.stringify(payload);
        const signature = generateSignature(payloadString, webhook.secret);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Zhort-Signature': signature,
            'X-Zhort-Event': event,
            'User-Agent': 'Zhort-Webhooks/1.0',
          },
          body: payloadString,
        });

        if (response.ok) {
          // Update last triggered timestamp
          await db
            .update(webhooks)
            .set({ lastTriggeredAt: new Date() })
            .where(eq(webhooks.id, webhook.id));
        } else {
          console.error(`Webhook ${webhook.id} failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Webhook ${webhook.id} error:`, error);
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
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

