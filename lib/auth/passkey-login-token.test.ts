import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import { createFixture, NOW, USER } from './passkey-auth-attempt.test-support';

describe('passkey login tokens', () => {
  it('completes an attempt once and stores only the token hash', async () => {
    const { store, service } = createFixture();
    const attemptId = await service.start(USER.id, 'server-challenge');

    const token = await service.complete(attemptId, USER.id);

    expect(token).toBe('verified-passkey-token-1');
    expect(store.attempts.get(attemptId)).toMatchObject({
      challenge: null,
      challengeExpiresAt: null,
      loginTokenHash: createHash('sha256')
        .update('verified-passkey-token-1')
        .digest('hex'),
      loginTokenExpiresAt: new Date('2026-07-20T04:02:00.000Z'),
    });
    await expect(service.complete(attemptId, USER.id)).resolves.toBeNull();
  });

  it('rejects the former static authenticated marker', async () => {
    const { service } = createFixture();
    const attemptId = await service.start(USER.id, 'server-challenge');
    await service.complete(attemptId, USER.id);

    await expect(
      service.consumeLoginToken(USER.email, 'authenticated'),
    ).resolves.toBeNull();
  });

  it('accepts each completed attempt token exactly once', async () => {
    const { service } = createFixture();
    const firstId = await service.start(USER.id, 'first-challenge');
    const secondId = await service.start(USER.id, 'second-challenge');
    const firstToken = await service.complete(firstId, USER.id);
    const secondToken = await service.complete(secondId, USER.id);

    expect(firstToken).toBe('verified-passkey-token-1');
    expect(secondToken).toBe('verified-passkey-token-2');
    await expect(
      service.consumeLoginToken('other@example.com', firstToken!),
    ).resolves.toBeNull();
    await expect(
      service.consumeLoginToken(USER.email, firstToken!),
    ).resolves.toEqual(USER);
    await expect(
      service.consumeLoginToken(USER.email, firstToken!),
    ).resolves.toBeNull();
    await expect(
      service.consumeLoginToken(USER.email, secondToken!),
    ).resolves.toEqual(USER);
    await expect(
      service.consumeLoginToken(USER.email, secondToken!),
    ).resolves.toBeNull();
  });

  it('rejects cross-user and expired attempt completion', async () => {
    let currentTime = NOW;
    const { service } = createFixture(() => currentTime);
    const attemptId = await service.start(USER.id, 'server-challenge');

    await expect(service.complete(attemptId, 99)).resolves.toBeNull();
    currentTime = new Date('2026-07-20T04:02:01.000Z');
    await expect(service.complete(attemptId, USER.id)).resolves.toBe(
      'verified-passkey-token-2',
    );
    currentTime = new Date('2026-07-20T04:05:01.000Z');
    await expect(service.complete(attemptId, USER.id)).resolves.toBeNull();
  });

  it('rejects expired tokens', async () => {
    let currentTime = NOW;
    const { service } = createFixture(() => currentTime);
    const attemptId = await service.start(USER.id, 'server-challenge');
    const token = await service.complete(attemptId, USER.id);
    currentTime = new Date('2026-07-20T04:02:01.000Z');

    await expect(
      service.consumeLoginToken(USER.email, token!),
    ).resolves.toBeNull();
  });
});
