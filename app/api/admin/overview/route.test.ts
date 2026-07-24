import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const {
  checkRateLimit,
  getBlocklistStats,
  getSession,
  isSuperAdmin,
  selectFrom,
} = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getBlocklistStats: vi.fn(),
  getSession: vi.fn(),
  isSuperAdmin: vi.fn(),
  selectFrom: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getSession,
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

vi.mock('@/lib/admin', () => ({
  isSuperAdmin,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit,
  getRateLimitHeaders: () => ({}),
}));

vi.mock('@/lib/db/blocklist-service', () => ({
  getBlocklistStats,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: selectFrom,
  },
}));

function overviewRequest() {
  return new NextRequest('https://zhort.de/api/admin/overview', {
    headers: { 'x-forwarded-for': '192.0.2.10' },
  });
}

describe('admin overview route', () => {
  beforeEach(() => {
    getSession.mockReset();
    isSuperAdmin.mockReset();
    getBlocklistStats.mockReset();
    selectFrom.mockReset();
    checkRateLimit.mockReset();
    checkRateLimit.mockResolvedValue({
      status: 'allowed',
      success: true,
      limit: 120,
      remaining: 119,
      reset: new Date('2026-07-22T05:00:00.000Z'),
    });
  });

  it('rejects unauthenticated overview requests', async () => {
    getSession.mockResolvedValue(null);

    const response = await GET(overviewRequest());

    expect(response.status).toBe(403);
  });

  it('returns operational metrics for super admins', async () => {
    getSession.mockResolvedValue({
      user: { id: '1', email: 'ops@example.com', role: 'admin' },
    });
    isSuperAdmin.mockReturnValue(true);
    getBlocklistStats.mockResolvedValue({
      total: 500,
      lastUpdate: new Date('2026-07-21T00:00:00.000Z'),
      ageHours: 1,
    });

    const createCountQuery = () => {
      const result = Promise.resolve([{ count: 3 }]);
      return {
        where: () => Promise.resolve([{ count: 3 }]),
        then: result.then.bind(result),
        catch: result.catch.bind(result),
        finally: result.finally.bind(result),
      };
    };

    selectFrom.mockImplementation(() => ({
      from: createCountQuery,
    }));

    const response = await GET(overviewRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toBe(3);
    expect(body.links).toBe(3);
    expect(body.pastes).toBe(3);
    expect(body.blocklist.status).toBe('active');
    expect(body.rateLimits.total).toBe(3);
    expect(body.rateLimits.activeLastHour).toBe(3);
  });
});
