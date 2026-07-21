import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const request = () => new NextRequest('https://zhort.de/p/secret/raw');
const context = { params: Promise.resolve({ slug: 'secret' }) };

describe('raw paste access', () => {
  beforeEach(() => {
    findPaste.mockReset();
    getSession.mockReset();
    getSession.mockResolvedValue(null);
  });

  it('does not disclose a password-protected paste without verified access', async () => {
    findPaste.mockResolvedValue({
      slug: 'secret',
      content: 'confidential content',
      userId: null,
      isPublic: true,
      passwordHash: 'stored-password-hash',
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
});
