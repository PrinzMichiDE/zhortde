import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from './rate-limit';

const {
  advisoryKeys,
  db,
  failTransactions,
  rateLimitRows,
  resetDatabase,
} = vi.hoisted(() => {
  type RateLimitRow = {
    identifier: string;
    action: string;
    count: number;
    windowStart: Date;
  };

  type SqlQuery = {
    queryChunks?: unknown[];
  };

  type MockTransaction = {
    execute: (query: SqlQuery) => Promise<void>;
    delete: (table: unknown) => {
      where: (condition: unknown) => Promise<void>;
    };
    select: () => {
      from: (table: unknown) => {
        where: (condition: unknown) => Promise<RateLimitRow[]>;
      };
    };
    insert: (table: unknown) => {
      values: (row: RateLimitRow) => Promise<void>;
    };
  };

  const rows: RateLimitRow[] = [];
  const observedAdvisoryKeys: string[] = [];
  const locks = new Map<string, Promise<void>>();
  let transactionFailure: Error | null = null;

  async function acquire(key: string): Promise<() => void> {
    const previous = locks.get(key) ?? Promise.resolve();
    let releaseLock = () => {};
    const held = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const queued = previous.then(() => held);
    locks.set(key, queued);

    await previous;

    return () => {
      releaseLock();
      if (locks.get(key) === queued) {
        locks.delete(key);
      }
    };
  }

  const transaction = vi.fn(
    async (callback: (tx: MockTransaction) => Promise<unknown>) => {
      if (transactionFailure) {
        throw transactionFailure;
      }

      let action = '';
      let identifier = '';
      let release: (() => void) | undefined;

      const tx: MockTransaction = {
        execute: async (query) => {
          const key = query.queryChunks?.find(
            (chunk): chunk is string => typeof chunk === 'string',
          );
          if (!key) {
            throw new Error('Expected an advisory-lock key parameter');
          }

          observedAdvisoryKeys.push(key);
          release = await acquire(key);

          const parsedKey: unknown = JSON.parse(key);
          if (
            !Array.isArray(parsedKey)
            || parsedKey.length !== 2
            || typeof parsedKey[0] !== 'string'
            || typeof parsedKey[1] !== 'string'
          ) {
            throw new Error('Invalid advisory-lock key');
          }
          [action, identifier] = parsedKey;
        },
        delete: () => ({
          where: async () => {},
        }),
        select: () => ({
          from: () => ({
            where: async () => rows
              .filter(
                (row) => row.action === action && row.identifier === identifier,
              )
              .map((row) => ({ ...row })),
          }),
        }),
        insert: () => ({
          values: async (row) => {
            rows.push({ ...row });
          },
        }),
      };

      try {
        return await callback(tx);
      } finally {
        release?.();
      }
    },
  );

  return {
    advisoryKeys: observedAdvisoryKeys,
    db: { transaction },
    failTransactions: (error: Error) => {
      transactionFailure = error;
    },
    rateLimitRows: rows,
    resetDatabase: () => {
      rows.length = 0;
      observedAdvisoryKeys.length = 0;
      locks.clear();
      transactionFailure = null;
      transaction.mockClear();
    },
  };
});

vi.mock('./db', () => ({ db }));

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetDatabase();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows at most five concurrent attempts for one protected paste key', async () => {
    const results = await Promise.all(
      Array.from(
        { length: 20 },
        () => checkRateLimit('192.0.2.1:secret', 'access_protected_paste'),
      ),
    );

    expect(results.filter((result) => result.status === 'allowed')).toHaveLength(5);
    expect(results.filter((result) => result.status === 'limited')).toHaveLength(15);
    expect(rateLimitRows).toHaveLength(5);
    expect(new Set(advisoryKeys)).toEqual(
      new Set([JSON.stringify(['access_protected_paste', '192.0.2.1:secret'])]),
    );
    expect(db.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'read committed' },
    );
  });

  it('returns unavailable when protected-paste rate-limit storage fails', async () => {
    failTransactions(new Error('database unavailable'));

    const result = await checkRateLimit(
      '192.0.2.1:secret',
      'access_protected_paste',
    );

    expect(result).toMatchObject({
      status: 'unavailable',
      success: false,
      limit: 5,
      remaining: 0,
    });
  });

  it('preserves fail-open behavior for other rate-limit actions', async () => {
    failTransactions(new Error('database unavailable'));

    const result = await checkRateLimit('192.0.2.1', 'create_link_anonymous');

    expect(result).toMatchObject({
      status: 'allowed',
      success: true,
      limit: 10,
      remaining: 10,
    });
  });
});
