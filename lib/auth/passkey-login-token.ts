import { randomBytes } from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { sha256 } from '../security';

const TOKEN_MAX_AGE_MS = 2 * 60 * 1000;

export type PasskeyLoginUser = Pick<
  typeof users.$inferSelect,
  'id' | 'email' | 'role'
>;

export interface PasskeyLoginTokenStore {
  save(userId: number, tokenHash: string, expiresAt: Date): Promise<void>;
  consume(
    email: string,
    tokenHash: string,
    now: Date,
  ): Promise<PasskeyLoginUser | null>;
}

interface PasskeyLoginTokenServiceOptions {
  generateToken: () => string;
  now: () => Date;
}

export function createPasskeyLoginTokenService(
  store: PasskeyLoginTokenStore,
  options: PasskeyLoginTokenServiceOptions,
) {
  return {
    async issue(userId: number): Promise<string> {
      const token = options.generateToken();
      const expiresAt = new Date(options.now().getTime() + TOKEN_MAX_AGE_MS);
      await store.save(userId, sha256(token), expiresAt);
      return token;
    },

    consume(email: string, token: string): Promise<PasskeyLoginUser | null> {
      return store.consume(email, sha256(token), options.now());
    },
  };
}

const databaseTokenStore: PasskeyLoginTokenStore = {
  async save(userId, tokenHash, expiresAt) {
    await db
      .update(users)
      .set({
        passkeyLoginTokenHash: tokenHash,
        passkeyLoginExpiresAt: expiresAt,
      })
      .where(eq(users.id, userId));
  },

  async consume(email, tokenHash, now) {
    const [user] = await db
      .update(users)
      .set({
        passkeyLoginTokenHash: null,
        passkeyLoginExpiresAt: null,
      })
      .where(
        and(
          eq(users.email, email),
          eq(users.passkeyLoginTokenHash, tokenHash),
          gt(users.passkeyLoginExpiresAt, now),
        ),
      )
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });

    return user ?? null;
  },
};

const passkeyLoginTokenService = createPasskeyLoginTokenService(
  databaseTokenStore,
  {
    generateToken: () => randomBytes(32).toString('base64url'),
    now: () => new Date(),
  },
);

export function issuePasskeyLoginToken(userId: number): Promise<string> {
  return passkeyLoginTokenService.issue(userId);
}

export function consumePasskeyLoginToken(
  email: string,
  token: string,
): Promise<PasskeyLoginUser | null> {
  return passkeyLoginTokenService.consume(email, token);
}
