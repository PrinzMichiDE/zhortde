import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const {
  checkRateLimit,
  findPaste,
  getClientIp,
  getRateLimitHeaders,
  verifyPassword,
} = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  findPaste: vi.fn(),
  getClientIp: vi.fn(),
  getRateLimitHeaders: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      pastes: {
        findFirst: findPaste,
      },
    },
  },
}));

vi.mock('@/lib/password-protection', () => ({
  isExpired: (expiresAt: Date | null) => (
    expiresAt ? expiresAt.getTime() < Date.now() : false
  ),
  verifyPassword,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
}));

const context = { params: Promise.resolve({ slug: 'secret' }) };
const accessSecret = 'test-secret-with-at-least-thirty-two-characters';
const rateLimitSuccess = {
  success: true,
  limit: 5,
  remaining: 4,
  reset: new Date(Date.now() + 60_000),
};

function request(body: BodyInit = JSON.stringify({ password: 'correct' })) {
  return new NextRequest('https://zhort.de/api/pastes/secret/unlock', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '192.0.2.1',
    },
    body,
  });
}

describe('paste unlock endpoint', () => {
  beforeEach(() => {
    findPaste.mockReset();
    verifyPassword.mockReset();
    checkRateLimit.mockReset();
    getClientIp.mockReset();
    getRateLimitHeaders.mockReset();
    vi.stubEnv('NEXTAUTH_SECRET', accessSecret);

    findPaste.mockResolvedValue({
      slug: 'secret',
      passwordHash: 'stored-password-hash',
      expiresAt: null,
    });
    checkRateLimit.mockResolvedValue(rateLimitSuccess);
    getClientIp.mockReturnValue('192.0.2.1');
    getRateLimitHeaders.mockReturnValue({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects an incorrect password without issuing access', async () => {
    verifyPassword.mockResolvedValue(false);

    const response = await POST(request(), context);

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(verifyPassword).toHaveBeenCalledWith(
      'correct',
      'stored-password-hash',
    );
  });

  it('issues a scoped HttpOnly grant after password verification', async () => {
    verifyPassword.mockResolvedValue(true);

    const response = await POST(request(), context);
    const setCookie = response.headers.get('set-cookie');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      redirectTo: '/p/secret',
    });
    expect(setCookie).toContain('paste_access=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/p/secret');
    expect(setCookie).not.toContain('correct');
  });

  it('rejects malformed JSON as a client error', async () => {
    const response = await POST(request('{'), context);

    expect(response.status).toBe(400);
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it('rate limits password guesses before verification', async () => {
    checkRateLimit.mockResolvedValue({
      ...rateLimitSuccess,
      success: false,
      remaining: 0,
    });

    const response = await POST(request(), context);

    expect(response.status).toBe(429);
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(checkRateLimit).toHaveBeenCalledWith(
      '192.0.2.1:secret',
      'access_protected_paste',
    );
  });
});
