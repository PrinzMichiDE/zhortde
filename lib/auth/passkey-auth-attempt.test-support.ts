import {
  createPasskeyAuthAttemptService,
  type PasskeyAuthAttemptRecord,
  type PasskeyAuthAttemptStore,
  type PasskeyLoginUser,
} from './passkey-auth-attempt';

export const NOW = new Date('2026-07-20T04:00:00.000Z');
export const USER: PasskeyLoginUser = {
  id: 7,
  email: 'person@example.com',
  role: 'user',
};

export class InMemoryAttemptStore implements PasskeyAuthAttemptStore {
  attempts = new Map<string, PasskeyAuthAttemptRecord>();

  async deleteExpired(now: Date): Promise<void> {
    for (const [attemptId, attempt] of this.attempts) {
      const challengeExpired =
        attempt.challengeExpiresAt !== null &&
        attempt.challengeExpiresAt <= now;
      const tokenExpired =
        attempt.loginTokenExpiresAt !== null &&
        attempt.loginTokenExpiresAt <= now;
      if (challengeExpired || tokenExpired) {
        this.attempts.delete(attemptId);
      }
    }
  }

  async create(attempt: PasskeyAuthAttemptRecord): Promise<void> {
    this.attempts.set(attempt.id, attempt);
  }

  async getChallenge(
    attemptId: string,
    userId: number,
    now: Date,
  ): Promise<string | null> {
    const attempt = this.attempts.get(attemptId);
    if (
      !attempt ||
      attempt.userId !== userId ||
      !attempt.challenge ||
      !attempt.challengeExpiresAt ||
      attempt.challengeExpiresAt <= now
    ) {
      return null;
    }

    return attempt.challenge;
  }

  async complete(
    attemptId: string,
    userId: number,
    tokenHash: string,
    tokenExpiresAt: Date,
    now: Date,
  ): Promise<boolean> {
    const attempt = this.attempts.get(attemptId);
    if (
      !attempt ||
      attempt.userId !== userId ||
      !attempt.challenge ||
      !attempt.challengeExpiresAt ||
      attempt.challengeExpiresAt <= now
    ) {
      return false;
    }

    this.attempts.set(attemptId, {
      ...attempt,
      challenge: null,
      challengeExpiresAt: null,
      loginTokenHash: tokenHash,
      loginTokenExpiresAt: tokenExpiresAt,
    });
    return true;
  }

  async consumeLoginToken(
    email: string,
    tokenHash: string,
    now: Date,
  ): Promise<PasskeyLoginUser | null> {
    for (const [attemptId, attempt] of this.attempts) {
      if (
        email === USER.email &&
        attempt.userId === USER.id &&
        attempt.loginTokenHash === tokenHash &&
        attempt.loginTokenExpiresAt &&
        attempt.loginTokenExpiresAt > now
      ) {
        this.attempts.delete(attemptId);
        return USER;
      }
    }

    return null;
  }
}

export function createFixture(now: () => Date = () => NOW) {
  const store = new InMemoryAttemptStore();
  let attemptSequence = 0;
  let tokenSequence = 0;
  const service = createPasskeyAuthAttemptService(store, {
    generateAttemptId: () => `attempt-${++attemptSequence}`,
    generateToken: () => `verified-passkey-token-${++tokenSequence}`,
    now,
  });

  return { store, service };
}
