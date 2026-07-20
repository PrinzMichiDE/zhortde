import { randomBytes } from 'crypto';
import { and, eq, gt, isNotNull, lte, or } from 'drizzle-orm';
import { db } from '../db';
import { passkeyAuthAttempts, users } from '../db/schema';
import { sha256 } from '../security';

const CHALLENGE_MAX_AGE_MS = 5 * 60 * 1000;
const TOKEN_MAX_AGE_MS = 2 * 60 * 1000;

export type PasskeyLoginUser = Pick<
  typeof users.$inferSelect,
  'id' | 'email' | 'role'
>;

export interface PasskeyAuthAttemptRecord {
  id: string;
  userId: number;
  challenge: string | null;
  challengeExpiresAt: Date | null;
  loginTokenHash: string | null;
  loginTokenExpiresAt: Date | null;
}

export interface PasskeyAuthAttemptStore {
  deleteExpired(now: Date): Promise<void>;
  create(attempt: PasskeyAuthAttemptRecord): Promise<void>;
  getChallenge(
    attemptId: string,
    userId: number,
    now: Date,
  ): Promise<string | null>;
  complete(
    attemptId: string,
    userId: number,
    tokenHash: string,
    tokenExpiresAt: Date,
    now: Date,
  ): Promise<boolean>;
  consumeLoginToken(
    email: string,
    tokenHash: string,
    now: Date,
  ): Promise<PasskeyLoginUser | null>;
}

interface PasskeyAuthAttemptServiceOptions {
  generateAttemptId: () => string;
  generateToken: () => string;
  now: () => Date;
}

export function createPasskeyAuthAttemptService(
  store: PasskeyAuthAttemptStore,
  options: PasskeyAuthAttemptServiceOptions,
) {
  return {
    async start(userId: number, challenge: string): Promise<string> {
      const now = options.now();
      const attemptId = options.generateAttemptId();
      const challengeExpiresAt = new Date(
        now.getTime() + CHALLENGE_MAX_AGE_MS,
      );
      await store.deleteExpired(now);
      await store.create({
        id: attemptId,
        userId,
        challenge,
        challengeExpiresAt,
        loginTokenHash: null,
        loginTokenExpiresAt: null,
      });
      return attemptId;
    },

    getChallenge(attemptId: string, userId: number): Promise<string | null> {
      return store.getChallenge(attemptId, userId, options.now());
    },

    async complete(
      attemptId: string,
      userId: number,
    ): Promise<string | null> {
      const token = options.generateToken();
      const tokenExpiresAt = new Date(
        options.now().getTime() + TOKEN_MAX_AGE_MS,
      );
      const completed = await store.complete(
        attemptId,
        userId,
        sha256(token),
        tokenExpiresAt,
        options.now(),
      );
      return completed ? token : null;
    },

    consumeLoginToken(
      email: string,
      token: string,
    ): Promise<PasskeyLoginUser | null> {
      return store.consumeLoginToken(email, sha256(token), options.now());
    },
  };
}

const databaseAttemptStore: PasskeyAuthAttemptStore = {
  async deleteExpired(now) {
    await db
      .delete(passkeyAuthAttempts)
      .where(
        or(
          and(
            isNotNull(passkeyAuthAttempts.challengeExpiresAt),
            lte(passkeyAuthAttempts.challengeExpiresAt, now),
          ),
          and(
            isNotNull(passkeyAuthAttempts.loginTokenExpiresAt),
            lte(passkeyAuthAttempts.loginTokenExpiresAt, now),
          ),
        ),
      );
  },

  async create(attempt) {
    await db.insert(passkeyAuthAttempts).values(attempt);
  },

  async getChallenge(attemptId, userId, now) {
    const attempt = await db.query.passkeyAuthAttempts.findFirst({
      where: and(
        eq(passkeyAuthAttempts.id, attemptId),
        eq(passkeyAuthAttempts.userId, userId),
        isNotNull(passkeyAuthAttempts.challenge),
        gt(passkeyAuthAttempts.challengeExpiresAt, now),
      ),
      columns: { challenge: true },
    });

    return attempt?.challenge ?? null;
  },

  async complete(attemptId, userId, tokenHash, tokenExpiresAt, now) {
    const [completed] = await db
      .update(passkeyAuthAttempts)
      .set({
        challenge: null,
        challengeExpiresAt: null,
        loginTokenHash: tokenHash,
        loginTokenExpiresAt: tokenExpiresAt,
      })
      .where(
        and(
          eq(passkeyAuthAttempts.id, attemptId),
          eq(passkeyAuthAttempts.userId, userId),
          isNotNull(passkeyAuthAttempts.challenge),
          gt(passkeyAuthAttempts.challengeExpiresAt, now),
        ),
      )
      .returning({ id: passkeyAuthAttempts.id });

    return Boolean(completed);
  },

  async consumeLoginToken(email, tokenHash, now) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        id: true,
        email: true,
        role: true,
      },
    });
    if (!user) {
      return null;
    }

    const [consumed] = await db
      .delete(passkeyAuthAttempts)
      .where(
        and(
          eq(passkeyAuthAttempts.userId, user.id),
          eq(passkeyAuthAttempts.loginTokenHash, tokenHash),
          gt(passkeyAuthAttempts.loginTokenExpiresAt, now),
        ),
      )
      .returning({ id: passkeyAuthAttempts.id });

    return consumed ? user : null;
  },
};

const passkeyAuthAttemptService = createPasskeyAuthAttemptService(
  databaseAttemptStore,
  {
    generateAttemptId: () => randomBytes(32).toString('base64url'),
    generateToken: () => randomBytes(32).toString('base64url'),
    now: () => new Date(),
  },
);

export function startPasskeyAuthAttempt(
  userId: number,
  challenge: string,
): Promise<string> {
  return passkeyAuthAttemptService.start(userId, challenge);
}

export function getPasskeyAuthChallenge(
  attemptId: string,
  userId: number,
): Promise<string | null> {
  return passkeyAuthAttemptService.getChallenge(attemptId, userId);
}

export function completePasskeyAuthAttempt(
  attemptId: string,
  userId: number,
): Promise<string | null> {
  return passkeyAuthAttemptService.complete(attemptId, userId);
}

export function consumePasskeyLoginToken(
  email: string,
  token: string,
): Promise<PasskeyLoginUser | null> {
  return passkeyAuthAttemptService.consumeLoginToken(email, token);
}
