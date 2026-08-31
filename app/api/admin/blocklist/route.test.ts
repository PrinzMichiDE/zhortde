import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const {
  getBlocklistStats,
  getSession,
  isSuperAdmin,
  logAdminAction,
  updateBlocklist,
} = vi.hoisted(() => ({
  getBlocklistStats: vi.fn(),
  getSession: vi.fn(),
  isSuperAdmin: vi.fn(),
  logAdminAction: vi.fn(),
  updateBlocklist: vi.fn(),
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

vi.mock('@/lib/admin-audit', () => ({
  logAdminAction,
  AdminAuditActions: {
    BLOCKLIST_UPDATED: 'admin.blocklist.updated',
  },
}));

vi.mock('@/lib/db/blocklist-service', () => ({
  getBlocklistStats,
  updateBlocklist,
}));

describe('admin blocklist route', () => {
  beforeEach(() => {
    getSession.mockReset();
    isSuperAdmin.mockReset();
    getBlocklistStats.mockReset();
    updateBlocklist.mockReset();
    logAdminAction.mockReset();
  });

  it('rejects unauthenticated blocklist stats requests', async () => {
    getSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('returns blocklist stats for super admins', async () => {
    getSession.mockResolvedValue({
      user: { id: '1', email: 'ops@example.com', role: 'admin' },
    });
    isSuperAdmin.mockReturnValue(true);
    getBlocklistStats.mockResolvedValue({
      total: 1200,
      lastUpdate: new Date('2026-07-21T00:00:00.000Z'),
      ageHours: 2,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      total: 1200,
      lastUpdate: '2026-07-21T00:00:00.000Z',
      ageHours: 2,
      status: 'active',
    });
  });

  it('rejects blocklist refresh for non-super-admins', async () => {
    getSession.mockResolvedValue({
      user: { id: '2', email: 'user@example.com', role: 'user' },
    });
    isSuperAdmin.mockReturnValue(false);

    const response = await POST(new NextRequest('https://zhort.de/api/admin/blocklist', {
      method: 'POST',
    }));

    expect(response.status).toBe(403);
    expect(updateBlocklist).not.toHaveBeenCalled();
  });

  it('refreshes blocklist and writes an audit log for super admins', async () => {
    getSession.mockResolvedValue({
      user: { id: '3', email: 'ops@example.com', role: 'admin' },
    });
    isSuperAdmin.mockReturnValue(true);
    updateBlocklist.mockResolvedValue({ added: 42, total: 1000 });

    const response = await POST(new NextRequest('https://zhort.de/api/admin/blocklist', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.0.2.10' },
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateBlocklist).toHaveBeenCalledOnce();
    expect(logAdminAction).toHaveBeenCalledWith({
      adminUserId: 3,
      action: 'admin.blocklist.updated',
      resourceType: 'blocklist',
      ipAddress: '192.0.2.10',
      metadata: { added: 42, total: 1000 },
    });
  });
});
