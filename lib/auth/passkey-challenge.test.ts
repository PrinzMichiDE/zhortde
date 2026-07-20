import { describe, expect, it } from 'vitest';
import {
  createPasskeyChallengeService,
  type PasskeyChallengeStore,
} from './passkey-challenge';

const NOW = new Date('2026-07-20T04:00:00.000Z');

class InMemoryChallengeStore implements PasskeyChallengeStore {
  saved:
    | {
        userId: number;
        challenge: string;
        expiresAt: Date;
      }
    | undefined;

  async save(
    userId: number,
    challenge: string,
    expiresAt: Date,
  ): Promise<void> {
    this.saved = { userId, challenge, expiresAt };
  }

  async consume(email: string, now: Date): Promise<string | null> {
    if (
      email !== 'person@example.com' ||
      !this.saved ||
      this.saved.expiresAt <= now
    ) {
      return null;
    }

    const challenge = this.saved.challenge;
    this.saved = undefined;
    return challenge;
  }
}

describe('passkey authentication challenges', () => {
  it('stores a challenge with a five-minute expiry', async () => {
    const store = new InMemoryChallengeStore();
    const service = createPasskeyChallengeService(store, () => NOW);

    await service.save(7, 'server-generated-challenge');

    expect(store.saved).toEqual({
      userId: 7,
      challenge: 'server-generated-challenge',
      expiresAt: new Date('2026-07-20T04:05:00.000Z'),
    });
  });

  it('returns a stored challenge exactly once', async () => {
    const store = new InMemoryChallengeStore();
    const service = createPasskeyChallengeService(store, () => NOW);
    await service.save(7, 'server-generated-challenge');

    await expect(service.consume('person@example.com')).resolves.toBe(
      'server-generated-challenge',
    );
    await expect(
      service.consume('person@example.com'),
    ).resolves.toBeNull();
  });

  it('rejects an expired challenge', async () => {
    const store = new InMemoryChallengeStore();
    let currentTime = NOW;
    const service = createPasskeyChallengeService(
      store,
      () => currentTime,
    );
    await service.save(7, 'server-generated-challenge');
    currentTime = new Date('2026-07-20T04:05:01.000Z');

    await expect(
      service.consume('person@example.com'),
    ).resolves.toBeNull();
  });
});
