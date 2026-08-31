import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const {
  checkRateLimit,
  getSession,
  isSuperAdmin,
  limitMock,
  offsetMock,
  orderByMock,
  whereMock,
} = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getSession: vi.fn(),
  isSuperAdmin: vi.fn(),
  limitMock: vi.fn(),
  offsetMock: vi.fn(),
  orderByMock: vi.fn(),
  whereMock: vi.fn(),
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

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn((fields) => {
      if ('actorEmail' in fields) {
        return {
          from: () => ({
            leftJoin: () => ({
              where: whereMock.mockReturnValue({
                orderBy: orderByMock.mockReturnValue({
                  limit: limitMock.mockReturnValue({
                    offset: offsetMock.mockResolvedValue([
                      {
                        id: 1,
                        action: 'admin.user.deleted',
                        resourceType: 'admin',
                        resourceId: 9,
                        ipAddress: '192.0.2.1',
                        metadata: JSON.stringify({ deletedEmail: 'gone@example.com' }),
                        createdAt: new Date('2026-07-21T06:00:00.000Z'),
                        actorEmail: 'ops@example.com',
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }),
        };
      }

      return {
        from: () => ({
          where: whereMock.mockResolvedValue([{ count: 1 }]),
        }),
      };
    }),
  },
}));

describe('admin audit logs route', () => {
  beforeEach(() => {
    getSession.mockReset();
    isSuperAdmin.mockReset();
    limitMock.mockClear();
    offsetMock.mockClear();
    orderByMock.mockClear();
    whereMock.mockClear();
    checkRateLimit.mockReset();
    checkRateLimit.mockResolvedValue({
      status: 'allowed',
      success: true,
      limit: 120,
      remaining: 119,
      reset: new Date('2026-07-22T05:00:00.000Z'),
    });
  });

  it('rejects unauthenticated audit log requests', async () => {
    getSession.mockResolvedValue(null);

    const response = await GET(new NextRequest('https://zhort.de/api/admin/audit-logs'));

    expect(response.status).toBe(403);
  });

  it('returns paginated admin audit entries for super admins', async () => {
    getSession.mockResolvedValue({
      user: { id: '1', email: 'ops@example.com', role: 'admin' },
    });
    isSuperAdmin.mockReturnValue(true);

    const response = await GET(new NextRequest('https://zhort.de/api/admin/audit-logs?page=2&limit=10'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.page).toBe(2);
    expect(body.limit).toBe(10);
    expect(body.total).toBe(1);
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0]).toMatchObject({
      action: 'admin.user.deleted',
      actorEmail: 'ops@example.com',
      metadata: { deletedEmail: 'gone@example.com' },
    });
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(offsetMock).toHaveBeenCalledWith(10);
  });
});
