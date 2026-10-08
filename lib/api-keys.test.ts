import { describe, expect, it, vi } from 'vitest';
import { calculateApiKeyExpiry, rotateApiKey, generateApiKey } from './api-keys';

const now = new Date('2026-01-01T00:00:00.000Z');

describe('calculateApiKeyExpiry', () => {
  it('returns null for "never" and for an undefined selector', () => {
    expect(calculateApiKeyExpiry(undefined, now)).toBeNull();
    expect(calculateApiKeyExpiry('never', now)).toBeNull();
  });

  it('maps 30d/90d/365d to the correct absolute dates', () => {
    expect(calculateApiKeyExpiry('30d', now)?.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    expect(calculateApiKeyExpiry('90d', now)?.toISOString()).toBe('2026-04-01T00:00:00.000Z');
    expect(calculateApiKeyExpiry('365d', now)?.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe('generateApiKey', () => {
  it('emits the zhort_ format with a stable prefix', () => {
    const { key, prefix } = generateApiKey();
    expect(key).toMatch(/^zhort_[a-f0-9]{64}$/);
    expect(key.startsWith(prefix)).toBe(true);
    expect(prefix).toHaveLength(13);
  });
});

describe('rotateApiKey', () => {
  const { findKey, updateSet, db } = vi.hoisted(() => {
    const findKey = vi.fn();
    const updateSet = vi.fn();
    const updateWhere = vi.fn().mockResolvedValue([{ id: 1 }]);
    return {
      findKey,
      updateSet,
      db: {
        query: {
          apiKeys: {
            findFirst: findKey,
          },
        },
        update: () => ({
          set: (values: unknown) => {
            updateSet(values);
            return { where: updateWhere };
          },
        }),
      },
    };
  });

  vi.mock('./db', () => ({ db }));

  it('rejects rotation for a key that does not exist or belongs to another user', async () => {
    findKey.mockResolvedValue(null);
    expect(await rotateApiKey(1, 7)).toBeNull();

    findKey.mockResolvedValue({ id: 1, userId: 99 });
    expect(await rotateApiKey(1, 7)).toBeNull();
    expect(updateSet).not.toHaveBeenCalled();
  });

  it('issues a new key and replaces the stored hash/prefix', async () => {
    findKey.mockResolvedValue({ id: 1, userId: 7, keyHash: 'old', keyPrefix: 'zhort_abc' });

    const rotated = await rotateApiKey(1, 7);

    expect(rotated).not.toBeNull();
    expect(rotated?.key).toMatch(/^zhort_[a-f0-9]{64}$/);
    expect(rotated?.prefix).toHaveLength(13);

    const setValues = updateSet.mock.calls[0][0];
    expect(setValues.keyHash).not.toBe('old');
    expect(setValues.keyPrefix).toBe(rotated?.prefix);
    expect(setValues.lastUsedAt).toBeNull();
  });
});