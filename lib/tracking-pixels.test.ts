import { describe, expect, it } from 'vitest';
import {
  buildPixelSnippet,
  buildPixelsSnippet,
  isValidPixelId,
  parsePixelEvents,
  type TrackingPixel,
} from './pixel-snippets';

function pixel(overrides: Partial<TrackingPixel> = {}): TrackingPixel {
  return {
    id: 1,
    pixelType: 'facebook',
    pixelId: '12345',
    events: ['pageview'],
    isActive: true,
    ...overrides,
  };
}

describe('parsePixelEvents', () => {
  it('returns pageview for missing or invalid events', () => {
    expect(parsePixelEvents(null)).toEqual(['pageview']);
    expect(parsePixelEvents('not-json')).toEqual(['pageview']);
    expect(parsePixelEvents('[1, 2]')).toEqual(['pageview']);
  });

  it('parses a valid events array', () => {
    expect(parsePixelEvents('["pageview", "conversion"]')).toEqual(['pageview', 'conversion']);
  });
});

describe('isValidPixelId', () => {
  it('accepts safe identifiers', () => {
    expect(isValidPixelId('G-ABC123')).toBe(true);
    expect(isValidPixelId('1234567890')).toBe(true);
  });

  it('rejects values that could break out of HTML', () => {
    expect(isValidPixelId('"><script>alert(1)</script>')).toBe(false);
    expect(isValidPixelId('')).toBe(false);
    expect(isValidPixelId('x'.repeat(81))).toBe(false);
  });
});

describe('buildPixelSnippet', () => {
  it('builds a Facebook pixel with PageView and conversion events', () => {
    const snippet = buildPixelSnippet(
      pixel({ pixelId: 'FB123', events: ['pageview', 'conversion'] }),
    );
    expect(snippet).toContain('FB123');
    expect(snippet).toContain('fbq("init"');
    expect(snippet).toContain('fbq("track", "PageView")');
    expect(snippet).toContain('fbq("track", "Lead")');
  });

  it('omits conversion tracking when not subscribed', () => {
    const snippet = buildPixelSnippet(pixel({ pixelId: 'FB123', events: ['pageview'] }));
    expect(snippet).not.toContain('Lead');
  });

  it('builds a Google Analytics 4 snippet', () => {
    const snippet = buildPixelSnippet(pixel({ pixelType: 'google', pixelId: 'G-ABCDE12345' }));
    expect(snippet).toContain('G-ABCDE12345');
    expect(snippet).toContain('gtag("config"');
  });

  it('builds a custom image pixel from an http(s) URL', () => {
    const snippet = buildPixelSnippet(
      pixel({ pixelType: 'custom', pixelId: 'https://track.example.com/beacon.png' }),
    );
    expect(snippet).toContain('https://track.example.com/beacon.png');
    expect(snippet).toContain('<img');
  });

  it('returns an empty snippet for malicious or invalid inputs', () => {
    expect(buildPixelSnippet(pixel({ pixelId: '"><img src=x onerror=alert(1)>' }))).toBe('');
    expect(
      buildPixelSnippet(pixel({ pixelType: 'custom', pixelId: 'javascript:alert(1)' })),
    ).toBe('');
    expect(buildPixelSnippet(pixel({ pixelType: 'unknown' as never }))).toBe('');
  });

  it('joins multiple pixels into one block', () => {
    const combined = buildPixelsSnippet([
      pixel({ id: 1, pixelType: 'facebook', pixelId: 'FB1' }),
      pixel({ id: 2, pixelType: 'google', pixelId: 'G-2' }),
    ]);
    expect(combined).toContain('FB1');
    expect(combined).toContain('G-2');
  });
});