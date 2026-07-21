import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPasteAccessToken } from '@/lib/paste-access';
import PastePage from './page';

const {
  findPaste,
  getCookies,
  getSession,
  notFound,
  redirect,
} = vi.hoisted(() => ({
  findPaste: vi.fn(),
  getCookies: vi.fn(),
  getSession: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
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

vi.mock('next/headers', () => ({
  cookies: getCookies,
}));

vi.mock('next/navigation', () => ({
  notFound,
  redirect,
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

vi.mock('@/components/paste-display', () => ({
  PasteDisplay: () => null,
}));

const passwordHash = 'stored-password-hash';
const accessSecret = 'test-secret-with-at-least-thirty-two-characters';

describe('paste page access', () => {
  beforeEach(() => {
    findPaste.mockReset();
    getCookies.mockReset();
    getSession.mockReset();
    notFound.mockReset();
    redirect.mockReset();
    vi.stubEnv('NEXTAUTH_SECRET', accessSecret);

    findPaste.mockResolvedValue({
      slug: 'secret',
      content: 'confidential content',
      userId: null,
      syntaxHighlightingLanguage: null,
      isPublic: true,
      passwordHash,
      expiresAt: null,
      createdAt: new Date(),
    });
    getSession.mockResolvedValue(null);
    getCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });
    redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not accept a password supplied in the URL', async () => {
    const props = {
      params: Promise.resolve({ slug: 'secret' }),
      searchParams: Promise.resolve({ password: 'anything' }),
    };

    await expect(PastePage(props)).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/protected/paste/secret');
  });

  it('renders after receiving a valid server-issued access grant', async () => {
    const accessToken = createPasteAccessToken(
      'secret',
      passwordHash,
      accessSecret,
    );
    getCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    });

    await expect(
      PastePage({ params: Promise.resolve({ slug: 'secret' }) }),
    ).resolves.toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
});
