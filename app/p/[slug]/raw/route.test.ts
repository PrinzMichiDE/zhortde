import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPasteAccessToken,
  PASTE_ACCESS_COOKIE,
} from '@/lib/paste-access';
import { GET } from './route';

const { findPaste, getSession } = vi.hoisted(() => ({
  findPaste: vi.fn(),
  getSession: vi.fn(),
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

vi.mock('next-auth', () => ({
  getServerSession: getSession,
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

const request = (accessToken?: string) => new NextRequest(
  'https://zhort.de/p/secret/raw',
  accessToken
    ? { headers: { cookie: `${PASTE_ACCESS_COOKIE}=${accessToken}` } }
    : undefined,
);
const context = { params: Promise.resolve({ slug: 'secret' }) };
const passwordHash = 'stored-password-hash';
const accessSecret = 'test-secret-with-at-least-thirty-two-characters';

describe('raw paste access', () => {
  beforeEach(() => {
    findPaste.mockReset();
    getSession.mockReset();
    getSession.mockResolvedValue(null);
    vi.stubEnv('NEXTAUTH_SECRET', accessSecret);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not disclose a password-protected paste without verified access', async () => {
    findPaste.mockResolvedValue({
      slug: 'secret',
      content: 'confidential content',
      userId: null,
      isPublic: true,
      passwordHash,
      expiresAt: null,
    });

    const response = await GET(request(), context);

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.not.toContain('confidential content');
  });

  it('does not disclose expired paste content', async () => {
    findPaste.mockResolvedValue({
      slug: 'secret',
      content: 'expired content',
      userId: null,
      isPublic: true,
      passwordHash: null,
      expiresAt: new Date(Date.now() - 1_000),
    });

    const response = await GET(request(), context);

    expect(response.status).toBe(410);
    await expect(response.text()).resolves.not.toContain('expired content');
  });

  it('returns active unprotected public paste content', async () => {
    findPaste.mockResolvedValue({
      slug: 'secret',
      content: 'public content',
      userId: null,
      isPublic: true,
      passwordHash: null,
      expiresAt: null,
    });

    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('public content');
  });

  it('returns protected content after a valid server-issued access grant', async () => {
    findPaste.mockResolvedValue({
      slug: 'secret',
      content: 'confidential content',
      userId: null,
      isPublic: true,
      passwordHash,
      expiresAt: null,
    });
    const accessToken = createPasteAccessToken(
      'secret',
      passwordHash,
      accessSecret,
    );

    const response = await GET(request(accessToken), context);

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('confidential content');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
});
