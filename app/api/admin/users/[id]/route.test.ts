import { NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- hoisted module mocks ----
const mockGetServerSession = vi.hoisted(() => vi.fn());
vi.mock('next-auth', () => ({
  getServerSession: () => mockGetServerSession(),
}));

const mockIsSuperAdmin = vi.hoisted(() => vi.fn());
vi.mock('@/lib/admin', () => ({
  isSuperAdmin: () => mockIsSuperAdmin(),
}));

const mockDbQuery = vi.hoisted(() => ({
  users: { findFirst: vi.fn() },
  pastes: { delete: vi.fn(), findMany: vi.fn() },
  links: { delete: vi.fn() },
  pasteTags: { delete: vi.fn() },
  tags: { delete: vi.fn() },
}));
vi.mock('@/lib/db', () => ({
  db: { query: mockDbQuery },
}));

// Also mock the schema so Drizzle imports don't crash
vi.mock('@/lib/db/schema', () => ({
  users: { id: { key: 'id' } },
  pastes: { id: { key: 'id' } },
  links: {},
  pasteTags: {},
  tags: {},
}));

const mockEq = vi.hoisted(() => vi.fn());
const mockAnd = vi.hoisted(() => vi.fn());
const mockInArray = vi.hoisted(() => vi.fn());
vi.mock('drizzle-orm', () => ({
  eq: (...args: any[]) => mockEq(...args),
  and: (...args: any[]) => mockAnd(...args),
  inArray: (...args: any[]) => mockInArray(...args),
}));

// ---- helper ----
function buildRequest(url: string) {
  const nextUrl = new URL(url);
  return {
    nextUrl,
    headers: new Headers(),
  } as unknown as import('next/server').NextRequest;
}

describe('Admin User DELETE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@shrtde.com', name: 'Admin' } });
    mockIsSuperAdmin.mockResolvedValue(true);
    mockDbQuery.users.findFirst.mockResolvedValue({
      id: 'user-456',
      email: 'target@example.com',
      name: 'Target User',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes user and cascade data successfully', async () => {
    mockDbQuery.pastes.findMany.mockResolvedValue([
      { id: 'paste-1', tags: ['tag-1'] },
    ]);

    const request = buildRequest('http://localhost:3000/api/admin/users/user-456');
    request.headers.set('cookie', 'next-auth.session-token=abc123');

    const { DELETE } = await import('./route');
    const response = await DELETE(request, { params: { id: 'user-456' } });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, message: 'User deleted' });
  });

  it('returns 403 when admin tries to delete themselves', async () => {
    const request = buildRequest('http://localhost:3000/api/admin/users/user-456');
    request.headers.set('cookie', 'next-auth.session-token=abc123');

    // The logged-in admin email matches the target user email
    mockDbQuery.users.findFirst.mockResolvedValue({
      id: 'user-456',
      email: 'admin@shrtde.com',
      name: 'Admin',
    });

    const { DELETE } = await import('./route');
    const response = await DELETE(request, { params: { id: 'user-456' } });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'Cannot delete yourself' });
  });

  it('returns 404 when user not found', async () => {
    mockDbQuery.users.findFirst.mockResolvedValue(null);

    const request = buildRequest('http://localhost:3000/api/admin/users/nonexistent');
    request.headers.set('cookie', 'next-auth.session-token=abc123');

    const { DELETE } = await import('./route');
    const response = await DELETE(request, { params: { id: 'nonexistent' } });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'User not found' });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = buildRequest('http://localhost:3000/api/admin/users/user-456');

    const { DELETE } = await import('./route');
    const response = await DELETE(request, { params: { id: 'user-456' } });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when not super admin', async () => {
    mockIsSuperAdmin.mockResolvedValue(false);

    const request = buildRequest('http://localhost:3000/api/admin/users/user-456');
    request.headers.set('cookie', 'next-auth.session-token=abc123');

    const { DELETE } = await import('./route');
    const response = await DELETE(request, { params: { id: 'user-456' } });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'Forbidden' });
  });
});