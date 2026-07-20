import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import {
  createPasskeyLoginTokenService,
  type PasskeyLoginTokenStore,
  type PasskeyLoginUser,
} from './passkey-login-token';

const NOW = new Date('2026-07-20T04:00:00.000Z');
const USER: PasskeyLoginUser = {
  id: 7,
  email: 'person@example.com',
  role: 'user',
};

class InMemoryTokenStore implements PasskeyLoginTokenStore {
  saved:
    | {
        userId: number;
        tokenHash: string;
        expiresAt: Date;
      }
    | undefined;

  consumed = false;

  async save(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    this.saved = { userId, tokenHash, expiresAt };
    this.consumed = false;
  }

  async consume(
    email: string,
    tokenHash: string,
    now: Date,
  ): Promise<PasskeyLoginUser | null> {
    if (
      this.consumed ||
      !this.saved ||
      email !== USER.email ||
      tokenHash !== this.saved.tokenHash ||
      this.saved.expiresAt <= now
    ) {
      return null;
    }

    this.consumed = true;
    return USER;
  }
}

describe('passkey login tokens', () => {
  it('stores only a hash of the issued token', async () => {
    const store = new InMemoryTokenStore();
    const service = createPasskeyLoginTokenService(store, {
      generateToken: () => 'verified-passkey-token',
      now: () => NOW,
    });

    const token = await service.issue(USER.id);

    expect(token).toBe('verified-passkey-token');
    expect(store.saved).toEqual({
      userId: USER.id,
      tokenHash: createHash('sha256')
        .update('verified-passkey-token')
        .digest('hex'),
      expiresAt: new Date('2026-07-20T04:02:00.000Z'),
    });
    expect(store.saved?.tokenHash).not.toBe(token);
  });

  it('rejects the former static authenticated marker', async () => {
    const store = new InMemoryTokenStore();
    const service = createPasskeyLoginTokenService(store, {
      generateToken: () => 'verified-passkey-token',
      now: () => NOW,
    });
    await service.issue(USER.id);

    await expect(
      service.consume(USER.email, 'authenticated'),
    ).resolves.toBeNull();
  });

  it('accepts a server-issued token exactly once', async () => {
    const store = new InMemoryTokenStore();
    const service = createPasskeyLoginTokenService(store, {
      generateToken: () => 'verified-passkey-token',
      now: () => NOW,
    });
    const token = await service.issue(USER.id);

    await expect(service.consume(USER.email, token)).resolves.toEqual(USER);
    await expect(service.consume(USER.email, token)).resolves.toBeNull();
  });

  it('rejects expired tokens', async () => {
    const store = new InMemoryTokenStore();
    let currentTime = NOW;
    const service = createPasskeyLoginTokenService(store, {
      generateToken: () => 'verified-passkey-token',
      now: () => currentTime,
    });
    const token = await service.issue(USER.id);
    currentTime = new Date('2026-07-20T04:02:01.000Z');

    await expect(service.consume(USER.email, token)).resolves.toBeNull();
  });
});
