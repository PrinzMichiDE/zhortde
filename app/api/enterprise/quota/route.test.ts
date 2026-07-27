import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const {
  assertTeamMembership,
  checkTeamQuota,
  getSession,
} = vi.hoisted(() => ({
  assertTeamMembership: vi.fn(),
  checkTeamQuota: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getSession,
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

vi.mock('@/lib/enterprise-team-access', () => ({
  assertTeamMembership,
}));

vi.mock('@/lib/enterprise', () => ({
  checkTeamQuota,
}));

describe('enterprise quota route', () => {
  beforeEach(() => {
    getSession.mockReset();
    assertTeamMembership.mockReset();
    checkTeamQuota.mockReset();
  });

  it('rejects unauthenticated requests', async () => {
    getSession.mockResolvedValue(null);

    const response = await GET(
      new NextRequest('https://zhort.de/api/enterprise/quota?teamId=1'),
    );

    expect(response.status).toBe(401);
  });

  it('rejects non-members from reading team quota', async () => {
    getSession.mockResolvedValue({ user: { id: '7', email: 'user@example.com' } });
    assertTeamMembership.mockResolvedValue({
      allowed: false,
      status: 403,
      error: 'Forbidden',
    });

    const response = await GET(
      new NextRequest('https://zhort.de/api/enterprise/quota?teamId=5'),
    );

    expect(response.status).toBe(403);
    expect(checkTeamQuota).not.toHaveBeenCalled();
  });

  it('returns quota data for team members', async () => {
    getSession.mockResolvedValue({ user: { id: '7', email: 'user@example.com' } });
    assertTeamMembership.mockResolvedValue({ allowed: true });
    checkTeamQuota.mockResolvedValue({
      allowed: true,
      current: 12,
      quota: 100,
      resetDate: new Date('2026-08-01T00:00:00.000Z'),
    });

    const response = await GET(
      new NextRequest('https://zhort.de/api/enterprise/quota?teamId=5'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.quota.current).toBe(12);
  });
});
