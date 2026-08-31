import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertActivityTeamMembership,
  assertTeamMembership,
} from './enterprise-team-access';

const { findFirstTeam, findFirstMember, findFirstActivity } = vi.hoisted(() => ({
  findFirstTeam: vi.fn(),
  findFirstMember: vi.fn(),
  findFirstActivity: vi.fn(),
}));

vi.mock('./db', () => ({
  db: {
    query: {
      teams: { findFirst: findFirstTeam },
      teamMembers: { findFirst: findFirstMember },
      teamActivityFeed: { findFirst: findFirstActivity },
    },
  },
}));

describe('assertTeamMembership', () => {
  beforeEach(() => {
    findFirstTeam.mockReset();
    findFirstMember.mockReset();
    findFirstActivity.mockReset();
  });

  it('returns 404 when the team does not exist', async () => {
    findFirstTeam.mockResolvedValue(null);

    const result = await assertTeamMembership(7, 99);

    expect(result).toEqual({
      allowed: false,
      status: 404,
      error: 'Team not found',
    });
  });

  it('allows the team owner without a membership row', async () => {
    findFirstTeam.mockResolvedValue({ id: 5, ownerId: 7 });

    const result = await assertTeamMembership(7, 5);

    expect(result).toEqual({ allowed: true });
    expect(findFirstMember).not.toHaveBeenCalled();
  });

  it('allows team members', async () => {
    findFirstTeam.mockResolvedValue({ id: 5, ownerId: 1 });
    findFirstMember.mockResolvedValue({ userId: 7, teamId: 5, role: 'member' });

    const result = await assertTeamMembership(7, 5);

    expect(result).toEqual({ allowed: true });
  });

  it('denies non-members', async () => {
    findFirstTeam.mockResolvedValue({ id: 5, ownerId: 1 });
    findFirstMember.mockResolvedValue(null);

    const result = await assertTeamMembership(7, 5);

    expect(result).toEqual({
      allowed: false,
      status: 403,
      error: 'Forbidden',
    });
  });
});

describe('assertActivityTeamMembership', () => {
  beforeEach(() => {
    findFirstTeam.mockReset();
    findFirstMember.mockReset();
    findFirstActivity.mockReset();
  });

  it('returns 404 when the activity does not exist', async () => {
    findFirstActivity.mockResolvedValue(null);

    const result = await assertActivityTeamMembership(7, 42);

    expect(result).toEqual({
      allowed: false,
      status: 404,
      error: 'Activity not found',
    });
  });

  it('delegates to team membership for the activity team', async () => {
    findFirstActivity.mockResolvedValue({ id: 42, teamId: 5 });
    findFirstTeam.mockResolvedValue({ id: 5, ownerId: 7 });

    const result = await assertActivityTeamMembership(7, 42);

    expect(result).toEqual({ allowed: true });
  });
});
