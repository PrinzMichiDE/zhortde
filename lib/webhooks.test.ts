import { describe, expect, it, vi } from 'vitest';
import { triggerWebhooks } from './webhooks';

vi.mock('./db', () => ({
  db: {
    query: {
      webhooks: {
        findMany: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

describe('webhook SSRF guard', () => {
  it('does not fetch unsafe webhook URLs', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { db } = await import('./db');
    vi.mocked(db.query.webhooks.findMany).mockResolvedValue([
      {
        id: 1,
        userId: 1,
        url: 'http://127.0.0.1/internal',
        secret: 'secret',
        isActive: true,
        events: JSON.stringify(['link.created']),
      },
    ] as never);

    await triggerWebhooks(1, 'link.created', {
      linkId: 1,
      shortCode: 'abc',
      longUrl: 'https://example.com',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
