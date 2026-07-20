import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

const CHALLENGE_MAX_AGE_MS = 5 * 60 * 1000;

export interface PasskeyChallengeStore {
  save(userId: number, challenge: string, expiresAt: Date): Promise<void>;
  consume(email: string, now: Date): Promise<string | null>;
}

export function createPasskeyChallengeService(
  store: PasskeyChallengeStore,
  now: () => Date,
) {
  return {
    save(userId: number, challenge: string): Promise<void> {
      const expiresAt = new Date(now().getTime() + CHALLENGE_MAX_AGE_MS);
      return store.save(userId, challenge, expiresAt);
    },

    consume(email: string): Promise<string | null> {
      return store.consume(email, now());
    },
  };
}

const databaseChallengeStore: PasskeyChallengeStore = {
  async save(userId, challenge, expiresAt) {
    await db
      .update(users)
      .set({
        passkeyChallenge: challenge,
        passkeyChallengeExpiresAt: expiresAt,
      })
      .where(eq(users.id, userId));
  },

  async consume(email, now) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        gt(users.passkeyChallengeExpiresAt, now),
      ),
      columns: {
        id: true,
        passkeyChallenge: true,
      },
    });

    if (!user?.passkeyChallenge) {
      return null;
    }

    const [consumed] = await db
      .update(users)
      .set({
        passkeyChallenge: null,
        passkeyChallengeExpiresAt: null,
      })
      .where(
        and(
          eq(users.id, user.id),
          eq(users.passkeyChallenge, user.passkeyChallenge),
          gt(users.passkeyChallengeExpiresAt, now),
        ),
      )
      .returning({ id: users.id });

    return consumed ? user.passkeyChallenge : null;
  },
};

const passkeyChallengeService = createPasskeyChallengeService(
  databaseChallengeStore,
  () => new Date(),
);

export function savePasskeyChallenge(
  userId: number,
  challenge: string,
): Promise<void> {
  return passkeyChallengeService.save(userId, challenge);
}

export function consumePasskeyChallenge(email: string): Promise<string | null> {
  return passkeyChallengeService.consume(email);
}
