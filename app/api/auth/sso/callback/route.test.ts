import { NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- hoisted module mocks ----
const mockSignIn = vi.hoisted(() => vi.fn());
const nextAuthReact = { signIn: mockSignIn };
vi.mock('next-auth/react', () => ({ signIn: () => nextAuthReact.signIn() }));

const mockDbQuery = vi.hoisted(() => ({
  ssoDomains: { findFirst: vi.fn() },
  users: { findFirst: vi.fn(), update: vi.fn(), insert: vi.fn() },
}));
vi.mock('@/lib/db', () => ({
  db: { query: mockDbQuery },
}));

const mockRedirect = vi.fn();
vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(url: string) {
      this.nextUrl = new URL(url);
    }
    nextUrl: URL;
  },
  NextResponse: {
    get redirect() { return mockRedirect; },
    json: NextResponse.json,
  },
}));

// ---- helper to build a NextRequest-like object ----
function buildRequest(url: string) {
  const nextUrl = new URL(url);
  return { nextUrl } as unknown as import('next/server').NextRequest;
}

describe('app/api/auth/sso/callback/route.ts', () => {
  let route: typeof import('./route');

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  it('rejects requests missing code and state', async () => {
    route = await import('./route');
    const res = await route.GET(buildRequest('http://localhost/callback'));
    expect(res.status).toBe(307);
    expect(mockRedirect).toHaveBeenCalled();
  });

  it('rejects requests with an error query param', async () => {
    route = await import('./route');
    const res = await route.GET(buildRequest('http://localhost/callback?error=access_denied'));
    expect(res.status).toBe(307);
    expect(mockRedirect).toHaveBeenCalled();
  });

  it('uses signIn from next-auth instead of redirecting to /login/sso-callback when SSO config is missing', async () => {
    route = await import('./route');
    mockDbQuery.ssoDomains.findFirst.mockResolvedValue(null);
    const encodedState = Buffer.from(JSON.stringify({ domain: 'evil.com', provider: 'oauth2' }))
      .toString('base64');
    const res = await route.GET(buildRequest(`http://localhost/callback?code=abc&state=${encodedState}`));
    expect(res.status).toBe(307);
    // The fix: should NOT redirect to /login/sso-callback
    const redirectCalls = mockRedirect.mock.calls;
    const ssoCallbackCalls = redirectCalls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('/login/sso-callback')
    );
    expect(ssoCallbackCalls).toHaveLength(0);
  });

  it('uses signIn from next-auth with ssoToken for a verified domain', async () => {
    route = await import('./route');
    mockDbQuery.ssoDomains.findFirst.mockResolvedValue({ domain: 'example.com', provider: 'oauth2' });
    mockDbQuery.users.findFirst.mockResolvedValue(null);
    mockDbQuery.users.insert.mockResolvedValue({ id: 1 });
    mockSignIn.mockResolvedValue({ url: 'http://localhost/dashboard' });

    const encodedState = Buffer.from(JSON.stringify({ domain: 'example.com', provider: 'oauth2' }))
      .toString('base64');
    const res = await route.GET(buildRequest(`http://localhost/callback?code=abc&state=${encodedState}`));

    // signIn('credentials', { ssoToken, email, redirect: false }) must have been called
    expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
      ssoToken: 'abc',
      redirect: false,
    }));
    expect(res.status).toBe(307);
  });
});