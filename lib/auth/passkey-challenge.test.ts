import { describe, expect, it } from 'vitest';
import { createFixture, NOW, USER } from './passkey-auth-attempt.test-support';

describe('passkey authentication challenges', () => {
  it('stores each challenge as a distinct five-minute attempt', async () => {
    const { store, service } = createFixture();

    const firstId = await service.start(USER.id, 'first-challenge');
    const secondId = await service.start(USER.id, 'second-challenge');

    expect(firstId).not.toBe(secondId);
    expect(store.attempts.get(firstId)).toMatchObject({
      userId: USER.id,
      challenge: 'first-challenge',
      challengeExpiresAt: new Date('2026-07-20T04:05:00.000Z'),
    });
    await expect(
      service.getChallenge(firstId, USER.id),
    ).resolves.toBe('first-challenge');
    await expect(
      service.getChallenge(secondId, USER.id),
    ).resolves.toBe('second-challenge');
  });

  it('does not consume a challenge when it is read for verification', async () => {
    const { service } = createFixture();
    const attemptId = await service.start(USER.id, 'server-challenge');

    await expect(
      service.getChallenge(attemptId, USER.id),
    ).resolves.toBe('server-challenge');
    await expect(
      service.getChallenge(attemptId, USER.id),
    ).resolves.toBe('server-challenge');
  });

  it('rejects expired and cross-user attempts', async () => {
    let currentTime = NOW;
    const { service } = createFixture(() => currentTime);
    const attemptId = await service.start(USER.id, 'server-challenge');

    await expect(service.getChallenge(attemptId, 99)).resolves.toBeNull();
    currentTime = new Date('2026-07-20T04:05:01.000Z');
    await expect(
      service.getChallenge(attemptId, USER.id),
    ).resolves.toBeNull();
  });
});
