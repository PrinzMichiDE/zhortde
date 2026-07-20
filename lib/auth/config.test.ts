import type { CredentialsConfig } from 'next-auth/providers/credentials';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumePasskeyLoginToken } from '@/lib/auth/passkey-auth-attempt';
import { authOptions } from './config';

vi.mock('@/lib/auth/passkey-auth-attempt', () => ({
  consumePasskeyLoginToken: vi.fn(),
}));

const authorize = (authOptions.providers[0] as CredentialsConfig).authorize;
const request = {
  body: {},
  query: {},
  headers: { 'x-forwarded-for': '192.0.2.1' },
  method: 'POST',
};

describe('NextAuth passkey authorization', () => {
  beforeEach(() => {
    vi.mocked(consumePasskeyLoginToken).mockReset();
  });

  it('rejects the former static authenticated marker', async () => {
    vi.mocked(consumePasskeyLoginToken).mockResolvedValue(null);

    const result = await authorize(
      {
        email: 'person@example.com',
        passkey_token: 'authenticated',
      },
      request,
    );

    expect(result).toBeNull();
    expect(consumePasskeyLoginToken).toHaveBeenCalledWith(
      'person@example.com',
      'authenticated',
    );
  });

  it('creates a session identity from a consumed server token', async () => {
    vi.mocked(consumePasskeyLoginToken).mockResolvedValue({
      id: 7,
      email: 'person@example.com',
      role: 'user',
    });

    const result = await authorize(
      {
        email: 'person@example.com',
        passkey_token: 'server-issued-token',
      },
      request,
    );

    expect(result).toMatchObject({
      id: '7',
      email: 'person@example.com',
      role: 'user',
    });
  });

  it('rejects replay after a server token has been consumed', async () => {
    vi.mocked(consumePasskeyLoginToken)
      .mockResolvedValueOnce({
        id: 7,
        email: 'person@example.com',
        role: 'user',
      })
      .mockResolvedValueOnce(null);

    const credentials = {
      email: 'person@example.com',
      passkey_token: 'server-issued-token',
    };

    await expect(authorize(credentials, request)).resolves.toMatchObject({
      id: '7',
    });
    await expect(authorize(credentials, request)).resolves.toBeNull();
  });
});
