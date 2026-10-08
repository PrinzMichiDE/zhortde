import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const { findLink, validateApiKey, getLinkAnalytics } = vi.hoisted(() => ({
  findLink: vi.fn(),
  validateApiKey: vi.fn(),
  getLinkAnalytics: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      links: {
        findFirst: findLink,
      },
    },
  },
}));

vi.mock('@/lib/api-keys', () => ({
  validateApiKey,
}));

vi.mock('@/lib/analytics', () => ({
  getLinkAnalytics,
}));

const context = { params: Promise.resolve({ shortCode: 'abc' }) };

function authedRequest(): NextRequest {
  return new NextRequest('http://localhost/api/v1/links/abc/analytics', {
    headers: { authorization: 'Bearer zhort_testkey' },
  });
}

describe('GET /api/v1/links/[shortCode]/analytics', () => {
  it('returns 401 without an authorization header', async () => {
    const response = await GET(new NextRequest('http://localhost/api/v1/links/abc/analytics'), context);
    expect(response.status).toBe(401);
  });

  it('returns 401 for an invalid API key', async () => {
    validateApiKey.mockResolvedValue(null);
    const response = await GET(authedRequest(), context);
    expect(response.status).toBe(401);
  });

  it('returns 404 when the link does not exist', async () => {
    validateApiKey.mockResolvedValue(7);
    findLink.mockResolvedValue(null);
    const response = await GET(authedRequest(), context);
    expect(response.status).toBe(404);
  });

  it('returns 403 when the link belongs to another user', async () => {
    validateApiKey.mockResolvedValue(7);
    findLink.mockResolvedValue({ id: 1, userId: 99, shortCode: 'abc', longUrl: 'https://a.de' });
    const response = await GET(authedRequest(), context);
    expect(response.status).toBe(403);
  });

  it('returns click analytics for an owned link', async () => {
    validateApiKey.mockResolvedValue(7);
    findLink.mockResolvedValue({ id: 1, userId: 7, shortCode: 'abc', longUrl: 'https://a.de' });
    getLinkAnalytics.mockResolvedValue({
      totalClicks: 12,
      uniqueIps: 4,
      deviceBreakdown: { desktop: 10, mobile: 2 },
      countryBreakdown: { DE: 12 },
      browserBreakdown: { chrome: 12 },
      recentClicks: [],
    });

    const response = await GET(authedRequest(), context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.shortCode).toBe('abc');
    expect(body.totalClicks).toBe(12);
    expect(body.deviceBreakdown.desktop).toBe(10);
  });
});