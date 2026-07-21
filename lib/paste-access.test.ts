import { describe, expect, it } from 'vitest';
import {
  createPasteAccessToken,
  getPasteAccessCookiePath,
  PASTE_ACCESS_TTL_SECONDS,
  verifyPasteAccessToken,
} from './paste-access';

const secret = 'test-secret-with-at-least-thirty-two-characters';
const now = new Date('2026-07-21T04:00:00.000Z').getTime();

describe('paste access grants', () => {
  it('accepts an unexpired grant for its paste and password hash', () => {
    const token = createPasteAccessToken('paste-one', 'hash-one', secret, now);

    expect(
      verifyPasteAccessToken(token, 'paste-one', 'hash-one', secret, now),
    ).toBe(true);
  });

  it('rejects a grant after its expiry', () => {
    const token = createPasteAccessToken('paste-one', 'hash-one', secret, now);

    expect(
      verifyPasteAccessToken(
        token,
        'paste-one',
        'hash-one',
        secret,
        now + PASTE_ACCESS_TTL_SECONDS * 1_000,
      ),
    ).toBe(false);
  });

  it('rejects grants for a different paste or changed password hash', () => {
    const token = createPasteAccessToken('paste-one', 'hash-one', secret, now);

    expect(
      verifyPasteAccessToken(token, 'paste-two', 'hash-one', secret, now),
    ).toBe(false);
    expect(
      verifyPasteAccessToken(token, 'paste-one', 'hash-two', secret, now),
    ).toBe(false);
  });

  it('rejects malformed and tampered grants', () => {
    const token = createPasteAccessToken('paste-one', 'hash-one', secret, now);

    expect(
      verifyPasteAccessToken(undefined, 'paste-one', 'hash-one', secret, now),
    ).toBe(false);
    expect(
      verifyPasteAccessToken(
        `${token.slice(0, -1)}x`,
        'paste-one',
        'hash-one',
        secret,
        now,
      ),
    ).toBe(false);
  });

  it('scopes the cookie path to the unlocked paste', () => {
    expect(getPasteAccessCookiePath('paste/one')).toBe('/p/paste%2Fone');
  });
});
