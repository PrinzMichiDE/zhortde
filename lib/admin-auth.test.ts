import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireSuperAdmin } from './admin-auth';

const { getSession, isSuperAdmin } = vi.hoisted(() => ({
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

describe('requireSuperAdmin', () => {
  beforeEach(() => {
    getSession.mockReset();
    isSuperAdmin.mockReset();
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
