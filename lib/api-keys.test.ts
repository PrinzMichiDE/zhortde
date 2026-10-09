import { describe, expect, it, vi } from 'vitest';

// Mock randomBytes at module top level
const mockRandomBytes = vi.hoisted(() => Buffer.alloc(32));
vi.mock('crypto', () => ({
  default: {
    randomBytes: () => mockRandomBytes,
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
  it('returns the same prefix with a new 64-char suffix', () => {
    const { prefix } = generateApiKey();
    const { key, prefix: newPrefix } = rotateApiKey(prefix);
    expect(newPrefix).toBe(prefix);
    expect(key).toMatch(/^zhort_[a-f0-9]{64}$/);
    expect(key).not.toMatch(prefix); // new suffix differs
  });

  it('handles invalid prefix gracefully', () => {
    const { key, prefix } = rotateApiKey('invalid_prefix');
    expect(key).toMatch(/^zhort_[a-f0-9]{64}$/);
    expect(prefix).toMatch(/^zhort_[a-f0-9]{12}$/);
  });
});