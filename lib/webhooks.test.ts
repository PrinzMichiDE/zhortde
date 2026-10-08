import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildWebhookPayload,
  deliverWebhook,
  generateWebhookSecret,
  triggerWebhooks,
  verifyWebhookSignature,
  WEBHOOK_MAX_ATTEMPTS,
} from './webhooks';

type WebhookRow = {
  id: number;
  userId: number;
  url: string;
  secret: string;
  events: string;
  isActive: boolean;
  lastTriggeredAt: Date | null;
};

const { db, rows, updateCalls } = vi.hoisted(() => {
  const webhookRows: WebhookRow[] = [];
  const updates: Array<{ id: number; lastTriggeredAt: Date }> = [];

  return {
    rows: webhookRows,
    updateCalls: updates,
    db: {
      query: {
        webhooks: {
          findMany: async () => webhookRows.map((row) => ({ ...row })),
        },
      },
      update: () => ({
        set: (values: { lastTriggeredAt?: Date }) => ({
          where: async () => {
            // Match the row by id passed into the query chain used in tests
            void values;
          },
        }),
      }),
    },
  };
});

vi.mock('./db', () => ({ db }));

function subscribe(row: Partial<WebhookRow> = {}) {
  const full: WebhookRow = {
    id: 1,
    userId: 7,
    url: 'https://example.com/hook',
    secret: 'test-secret',
    events: JSON.stringify(['link.clicked']),
    isActive: true,
    lastTriggeredAt: null,
    ...row,
  };
  rows.push(full);
  return full;
}

const fetchMock = vi.fn();

describe('webhook delivery', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    rows.length = 0;
    updateCalls.length = 0;
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('builds a timestamped payload', () => {
    const before = Date.now();
    const payload = buildWebhookPayload('link.created', { linkId: 1, shortCode: 'a', longUrl: 'https://a.de' });
    const after = Date.now();

    expect(payload.event).toBe('link.created');
    expect(new Date(payload.timestamp).getTime()).toBeGreaterThanOrEqual(before);
    expect(new Date(payload.timestamp).getTime()).toBeLessThanOrEqual(after);
    expect(payload.data).toMatchObject({ shortCode: 'a' });
  });

  it('delivers immediately when the endpoint acknowledges with 2xx', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    const payload = buildWebhookPayload('link.clicked', { linkId: 1, shortCode: 'a', longUrl: 'https://a.de' });
    const delivered = await deliverWebhook(
      { id: 1, url: 'https://example.com/hook', secret: 'secret', event: 'link.clicked' },
      payload
    );

    expect(delivered).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.com/hook');
    expect(init.method).toBe('POST');
    expect(init.headers['X-Zhort-Event']).toBe('link.clicked');
    expect(init.headers['User-Agent']).toBe('Zhort-Webhooks/1.0');

    // Signature must verify against the payload we sent
    expect(
      verifyWebhookSignature(init.body, init.headers['X-Zhort-Signature'], 'secret')
    ).toBe(true);
  });

  it('retries with backoff and succeeds on the second attempt', async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const payload = buildWebhookPayload('link.clicked', { linkId: 1, shortCode: 'a', longUrl: 'https://a.de' });
    const deliveredPromise = deliverWebhook(
      { id: 2, url: 'https://example.com/hook', secret: 'secret', event: 'link.clicked' },
      payload
    );

    await vi.advanceTimersByTimeAsync(1000);
    await expect(deliveredPromise).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting all attempts', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    const payload = buildWebhookPayload('link.clicked', { linkId: 1, shortCode: 'a', longUrl: 'https://a.de' });
    const deliveredPromise = deliverWebhook(
      { id: 3, url: 'https://example.com/hook', secret: 'secret', event: 'link.clicked' },
      payload
    );

    await vi.advanceTimersByTimeAsync(10_000);
    await expect(deliveredPromise).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(WEBHOOK_MAX_ATTEMPTS);
  });

  it('only notifies active webhooks subscribed to the event', async () => {
    subscribe({ id: 1, events: JSON.stringify(['link.clicked']) });
    subscribe({ id: 2, events: JSON.stringify(['link.created']), isActive: true });
    subscribe({ id: 3, events: JSON.stringify(['link.clicked']), isActive: false });

    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await triggerWebhooks(7, 'link.clicked', {
      linkId: 1,
      shortCode: 'a',
      longUrl: 'https://a.de',
    });

    // Only webhook #1 is active + subscribed to link.clicked
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.com/hook');
  });

  it('round-trips HMAC signatures and generates secrets', () => {
    const secret = generateWebhookSecret();
    const payload = JSON.stringify({ event: 'test' });

    // Direct verification path
    const hmac = createHmac('sha256', secret).update(payload).digest('hex');
    expect(verifyWebhookSignature(payload, hmac, secret)).toBe(true);
    expect(verifyWebhookSignature(payload, 'invalid', secret)).toBe(false);
    expect(secret).toMatch(/^[a-f0-9]{64}$/);
  });
});