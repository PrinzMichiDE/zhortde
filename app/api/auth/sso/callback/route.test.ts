import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- mocks ----
const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  ssoDomainsFindFirst: vi.fn(),
  usersFindFirst: vi.fn(),
  usersUpdate: vi.fn(),
  usersInsert: vi.fn(),
  redirect: vi.fn(),
  mockDbQuery: {
    ssoDomains: { findFirst: vi.fn() },
    users: { findFirst: vi.fn(), update: vi.fn(), insert: vi.fn() },
  },
}));

vi.mock('next-auth/react', () => ({
  signIn: mocks.signIn,
}));

vi.mock('@/lib/db', () => ({
  db: { query: mocks.mockDbQuery },
}));

vi.mock('next/server', () => ({
  NextRequest: class {
    constructor(public nextUrl: URL) {}
  },
  NextResponse: {
    json: vi.fn((data, init) => ({ ...data, status: init?.status || 200 })),
    redirect: vi.fn((url: string) => ({ redirect: url })),
  },
}));

import { handler } from './route';

describe('SSO Callback Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful callback', async () => {
    // test implementation
  });
});