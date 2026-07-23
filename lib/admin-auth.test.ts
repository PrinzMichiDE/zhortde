import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireSuperAdmin, requireSuperAdminApiAccess } from './admin-auth';

const { checkRateLimit, getSession, isSuperAdmin } = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getSession: vi.fn(),
  isSuperAdmin: vi.fn(),
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
  getRateLimitHeaders: (result: { limit: number; remaining: number; reset: Date }) => ({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
  }),
}));

function adminRequest(url = 'https://zhort.de/api/admin/test') {
  return new NextRequest(url, {
    headers: { 'x-forwarded-for': '192.0.2.10' },
  });
}

describe('requireSuperAdmin', () => {
  beforeEach(() => {
    getSession.mockReset();
    isSuperAdmin.mockReset();
    checkRateLimit.mockReset();
  });

  it('rejects unauthenticated requests', async () => {
    getSession.mockResolvedValue(null);

    const result = await requireSuperAdmin();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(403);
    }
  });

  it('rejects authenticated users who are not super admins', async () => {
    getSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', role: 'user' },
    });
    isSuperAdmin.mockReturnValue(false);

    const result = await requireSuperAdmin();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(403);
    }
  });

  it('accepts configured super admins', async () => {
    getSession.mockResolvedValue({
      user: { id: '7', email: 'ops@example.com', role: 'admin' },
    });
    isSuperAdmin.mockReturnValue(true);

    const result = await requireSuperAdmin();

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.session).toEqual({
        userId: 7,
        email: 'ops@example.com',
        role: 'admin',
      });
    }
  });
});

describe('requireSuperAdminApiAccess', () => {
  beforeEach(() => {
    getSession.mockReset();
    isSuperAdmin.mockReset();
    checkRateLimit.mockReset();
    checkRateLimit.mockResolvedValue({
      status: 'allowed',
      success: true,
      limit: 120,
      remaining: 119,
      reset: new Date('2026-07-22T05:00:00.000Z'),
    });
  });

  it('rejects rate-limited admin API requests with HTTP 429', async () => {
    getSession.mockResolvedValue({
      user: { id: '7', email: 'ops@example.com', role: 'admin' },
    });
    isSuperAdmin.mockReturnValue(true);
    checkRateLimit.mockResolvedValue({
      status: 'limited',
      success: false,
      limit: 120,
      remaining: 0,
      reset: new Date('2026-07-22T05:00:00.000Z'),
    });

    const result = await requireSuperAdminApiAccess(adminRequest());

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(429);
    }
    expect(checkRateLimit).toHaveBeenCalledWith(
      'admin:7:192.0.2.10',
      'admin_api',
    );
  });

  it('fails closed when admin rate-limit storage is unavailable', async () => {
    getSession.mockResolvedValue({
      user: { id: '7', email: 'ops@example.com', role: 'admin' },
    });
    isSuperAdmin.mockReturnValue(true);
    checkRateLimit.mockResolvedValue({
      status: 'unavailable',
      success: false,
      limit: 120,
      remaining: 0,
      reset: new Date('2026-07-22T05:00:00.000Z'),
    });

    const result = await requireSuperAdminApiAccess(adminRequest());

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(503);
    }
  });

  it('allows super admins when rate limit check passes', async () => {
    getSession.mockResolvedValue({
      user: { id: '7', email: 'ops@example.com', role: 'admin' },
    });
    isSuperAdmin.mockReturnValue(true);

    const result = await requireSuperAdminApiAccess(adminRequest());

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.session.userId).toBe(7);
    }
  });
});
