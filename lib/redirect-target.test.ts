import { describe, expect, it } from 'vitest';
import { resolveRedirectTarget } from './redirect-target';

describe('resolveRedirectTarget', () => {
  it('continues to the long URL when there is no schedule and no variant', () => {
    expect(
      resolveRedirectTarget({ longUrl: 'https://a.de', schedule: null, variantUrl: null }),
    ).toEqual({ kind: 'continue', url: 'https://a.de' });
  });

  it('prefers the A/B variant over the long URL when the split wins', () => {
    expect(
      resolveRedirectTarget({ longUrl: 'https://a.de', schedule: null, variantUrl: 'https://b.de' }),
    ).toEqual({ kind: 'continue', url: 'https://b.de' });
  });

  it('sends inactive scheduled links to the fallback URL', () => {
    expect(
      resolveRedirectTarget({
        longUrl: 'https://a.de',
        schedule: { isActive: false, fallbackUrl: 'https://fallback.de' },
        variantUrl: 'https://b.de',
      }),
    ).toEqual({ kind: 'schedule-inactive', url: 'https://fallback.de' });
  });

  it('reports schedule-inactive without a fallback URL', () => {
    expect(
      resolveRedirectTarget({
        longUrl: 'https://a.de',
        schedule: { isActive: false, fallbackUrl: null },
        variantUrl: null,
      }),
    ).toEqual({ kind: 'schedule-inactive', url: null });
  });

  it('treats a schedule that is missing as "always active"', () => {
    expect(
      resolveRedirectTarget({ longUrl: 'https://a.de', schedule: null, variantUrl: null }),
    ).not.toEqual(expect.objectContaining({ kind: 'schedule-inactive' }));
  });
});