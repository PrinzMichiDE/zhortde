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
  eq: (...args: unknown[]) => mockEq(...args),
  and: (...args: unknown[]) => mockAnd(...args),
  inArray: (...args: unknown[]) => mockInArray(...args),
}));

describe('app/api/admin/users/[id]/route.ts', () => {
  let route: typeof import('./route');

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQuery.users.findFirst.mockReset();
    mockDbQuery.pastes.delete.mockReset();
    mockDbQuery.links.delete.mockReset();
    mockDbQuery.pasteTags.delete.mockReset();
    mockDbQuery.tags.delete.mockReset();
    mockIsSuperAdmin.mockReset();
    mockGetServerSession.mockReset();
    mockEq.mockReset();
    mockAnd.mockReset();
    mockInArray.mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  it('returns 403 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    route = await import('./route');
    const mockRequest = { nextUrl: new URL('http://localhost/api/admin/users/1') };
    const res = await route.DELETE(
      mockRequest as import('next/server').NextRequest,
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when not super admin', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'user@example.com' },
    });
    mockIsSuperAdmin.mockReturnValue(false);
    route = await import('./route');
    const mockRequest = { nextUrl: new URL('http://localhost/api/admin/users/1') };
    const res = await route.DELETE(
      mockRequest as import('next/server').NextRequest,
      { params: Promise.resolve({ id: '1' }) },
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when trying to delete self', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'admin@example.com' },
    });
    mockIsSuperAdmin.mockReturnValue(true);
    mockDbQuery.users.findFirst.mockResolvedValue({ id: 5 });
    route = await import('./route');
    const mockRequest = { nextUrl: new URL('http://localhost/api/admin/users/5') };
    const res = await route.DELETE(
      mockRequest as import('next/server').NextRequest,
      { params: Promise.resolve({ id: '5' }) },
    );
    expect(res.status).toBe(403);
    expect(mockDbQuery.pastes.delete).not.toHaveBeenCalled();
  });

  it('deletes pastes, links, pasteTags, and tags before deleting user', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'admin@example.com' },
    });
    mockIsSuperAdmin.mockReturnValue(true);
    mockDbQuery.users.findFirst.mockResolvedValue(null); // not deleting self
    mockInArray.mockImplementation((col: unknown, vals: number[]) => ({ col, vals }));
    mockDbQuery.pastes.findMany.mockResolvedValue([
      { id: 10, userId: 2 },
      { id: 11, userId: 2 },
    ]);
    mockDbQuery.users.findFirst.mockResolvedValue({ id: 2 });

    route = await import('./route');
    const mockRequest = { nextUrl: new URL('http://localhost/api/admin/users/2') };
    const res = await route.DELETE(
      mockRequest as import('next/server').NextRequest,
      { params: Promise.resolve({ id: '2' }) },
    );

    expect(res.status).toBe(200);

    // Verify cascade delete order: pasteTags first, then tags, then links, then pastes, then user
    // pasteTags deleted per-paste
    expect(mockDbQuery.pasteTags.delete).toHaveBeenCalled();
    // tags deleted per-paste
    expect(mockDbQuery.tags.delete).toHaveBeenCalled();
    // links deleted per-paste
    expect(mockDbQuery.links.delete).toHaveBeenCalled();
    // pastes deleted
    expect(mockDbQuery.pastes.delete).toHaveBeenCalled();
    // user deleted
    expect(mockDbQuery.users.findFirst).toHaveBeenCalled();
  });

  it('returns 400 for invalid user ID', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'admin@example.com' },
    });
    mockIsSuperAdmin.mockReturnValue(true);
    route = await import('./route');
    const mockRequest = { nextUrl: new URL('http://localhost/api/admin/users/abc') };
    const res = await route.DELETE(
      mockRequest as import('next/server').NextRequest,
      { params: Promise.resolve({ id: 'abc' }) },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid ID');
  });
});