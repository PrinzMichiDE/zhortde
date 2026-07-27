import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, PATCH } from './route';

const {
  assertActivityTeamMembership,
  assertTeamMembership,
  getSession,
  getTeamActivityFeed,
  markActivityAsRead,
} = vi.hoisted(() => ({
  assertActivityTeamMembership: vi.fn(),
  assertTeamMembership: vi.fn(),
  getSession: vi.fn(),
  getTeamActivityFeed: vi.fn(),
  markActivityAsRead: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getSession,
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

vi.mock('@/lib/enterprise-team-access', () => ({
  assertTeamMembership,
  assertActivityTeamMembership,
}));

vi.mock('@/lib/enterprise-features', () => ({
  getTeamActivityFeed,
  markActivityAsRead,
}));

describe('enterprise activity route', () => {
  beforeEach(() => {
    getSession.mockReset();
    assertTeamMembership.mockReset();
    assertActivityTeamMembership.mockReset();
    getTeamActivityFeed.mockReset();
    markActivityAsRead.mockReset();
  });

  it('rejects activity feed reads from non-members', async () => {
    getSession.mockResolvedValue({ user: { id: '7', email: 'user@example.com' } });
    assertTeamMembership.mockResolvedValue({
      allowed: false,
      status: 403,
      error: 'Forbidden',
    });

    const response = await GET(
      new NextRequest('https://zhort.de/api/enterprise/activity?teamId=5'),
    );

    expect(response.status).toBe(403);
    expect(getTeamActivityFeed).not.toHaveBeenCalled();
  });

  it('returns activity feed for team members', async () => {
    getSession.mockResolvedValue({ user: { id: '7', email: 'user@example.com' } });
    assertTeamMembership.mockResolvedValue({ allowed: true });
    getTeamActivityFeed.mockResolvedValue([{ id: 1, title: 'Link created' }]);

    const response = await GET(
      new NextRequest('https://zhort.de/api/enterprise/activity?teamId=5'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.activities).toHaveLength(1);
  });

  it('rejects marking activity as read when user is not on the team', async () => {
    getSession.mockResolvedValue({ user: { id: '7', email: 'user@example.com' } });
    assertActivityTeamMembership.mockResolvedValue({
      allowed: false,
      status: 403,
      error: 'Forbidden',
    });

    const response = await PATCH(
      new NextRequest('https://zhort.de/api/enterprise/activity', {
        method: 'PATCH',
        body: JSON.stringify({ activityId: 42 }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(response.status).toBe(403);
    expect(markActivityAsRead).not.toHaveBeenCalled();
  });

  it('marks activity as read for team members', async () => {
    getSession.mockResolvedValue({ user: { id: '7', email: 'user@example.com' } });
    assertActivityTeamMembership.mockResolvedValue({ allowed: true });
    markActivityAsRead.mockResolvedValue(undefined);

    const response = await PATCH(
      new NextRequest('https://zhort.de/api/enterprise/activity', {
        method: 'PATCH',
        body: JSON.stringify({ activityId: 42 }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(response.status).toBe(200);
    expect(markActivityAsRead).toHaveBeenCalledWith(42);
  });
});
