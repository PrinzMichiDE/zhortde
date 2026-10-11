import { describe, expect, it, vi } from 'vitest';

// Mock randomBytes at module top level
const mockRandomBytes = vi.hoisted(() => Buffer.alloc(32));
vi.mock('crypto', () => ({
  default: {
    randomBytes: () => mockRandomBytes,
  },
}));

const mockApiKeysFindFirst = vi.hoisted(() => vi.fn());
vi.mock('./db', () => ({
  db: {
    query: { apiKeys: { findFirst: mockApiKeysFindFirst } },
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
  },
}));

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
  it('returns a new key with a 13-char prefix for an existing key', async () => {
    mockApiKeysFindFirst.mockResolvedValue({ id: 1, userId: 1 });
    const result = await rotateApiKey(1, 1);
    expect(result).not.toBeNull();
    expect(result?.key).toMatch(/^zhort_[a-f0-9]{64}$/);
    expect(result?.prefix).toHaveLength(13);
  });

  it('returns null when the key is not found', async () => {
    mockApiKeysFindFirst.mockResolvedValue(null);
    const result = await rotateApiKey(999, 1);
    expect(result).toBeNull();
  });
});