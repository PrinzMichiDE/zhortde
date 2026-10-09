import { describe, it, expect } from 'vitest';
import {
  buildUtmUrl,
  parseUtmUrl,
  validateUtmParameters,
  UTM_TEMPLATES,
  UTM_MEDIUMS,
  UTM_SOURCES,
} from '@/lib/utm-builder';
import type { UtmParameters } from '@/lib/utm-builder';

describe('buildUtmUrl', () => {
  it('returns baseUrl when no params are provided', () => {
    const result = buildUtmUrl('https://example.com', {});
    expect(result).toBe('https://example.com/');
  });

  it('appends utm_source parameter', () => {
    const result = buildUtmUrl('https://example.com', { source: 'newsletter' });
    expect(result).toContain('utm_source=newsletter');
  });

  it('appends utm_medium parameter', () => {
    const result = buildUtmUrl('https://example.com', { medium: 'cpc' });
    expect(result).toContain('utm_medium=cpc');
  });

  it('appends utm_campaign parameter', () => {
    const result = buildUtmUrl('https://example.com', { campaign: 'spring_sale' });
    expect(result).toContain('utm_campaign=spring_sale');
  });

  it('appends utm_term parameter', () => {
    const result = buildUtmUrl('https://example.com', { term: 'running+shoes' });
    expect(result).toContain('utm_term=running+shoes');
  });

  it('appends utm_content parameter', () => {
    const result = buildUtmUrl('https://example.com', { content: 'logo_link' });
    expect(result).toContain('utm_content=logo_link');
  });

  it('combines multiple parameters', () => {
    const params: UtmParameters = {
      source: 'google',
      medium: 'cpc',
      campaign: 'spring_sale',
    };
    const result = buildUtmUrl('https://example.com', params);
    expect(result).toContain('utm_source=google');
    expect(result).toContain('utm_medium=cpc');
    expect(result).toContain('utm_campaign=spring_sale');
  });

  it('preserves existing URL search params and adds UTM params', () => {
    const result = buildUtmUrl('https://example.com/page?id=123', { source: 'email' });
    expect(result).toContain('id=123');
    expect(result).toContain('utm_source=email');
  });

  it('overwrites existing UTM parameters in the base URL', () => {
    const result = buildUtmUrl(
      'https://example.com?utm_source=old',
      { source: 'new' }
    );
    expect(result).toContain('utm_source=new');
    expect(result).not.toContain('utm_source=old');
  });

  it('encodes special characters in parameters', () => {
    const result = buildUtmUrl('https://example.com', {
      campaign: 'sale & more',
    });
    expect(result).toContain('sale+%26+more');
  });

  it('throws on invalid base URL', () => {
    expect(() => buildUtmUrl('not-a-url', { source: 'test' })).toThrow(
      'Invalid URL'
    );
  });

  it('normalizes trailing slash on base URL', () => {
    const result = buildUtmUrl('https://example.com', { source: 'test' });
    expect(result).toBe('https://example.com/?utm_source=test');
  });
});

describe('parseUtmUrl', () => {
  it('returns empty object when no UTM params present', () => {
    const result = parseUtmUrl('https://example.com');
    expect(result).toEqual({});
  });

  it('parses utm_source', () => {
    const result = parseUtmUrl('https://example.com?utm_source=google');
    expect(result.source).toBe('google');
  });

  it('parses utm_medium', () => {
    const result = parseUtmUrl('https://example.com?utm_medium=email');
    expect(result.medium).toBe('email');
  });

  it('parses utm_campaign', () => {
    const result = parseUtmUrl('https://example.com?utm_campaign=new_launch');
    expect(result.campaign).toBe('new_launch');
  });

  it('parses utm_term', () => {
    const result = parseUtmUrl('https://example.com?utm_term=shoes');
    expect(result.term).toBe('shoes');
  });

  it('parses utm_content', () => {
    const result = parseUtmUrl('https://example.com?utm_content=button');
    expect(result.content).toBe('button');
  });

  it('parses all five UTM parameters', () => {
    const url =
      'https://example.com?utm_source=facebook&utm_medium=social&utm_campaign=summer_sale&utm_term=banner&utm_content=top_banner';
    const result = parseUtmUrl(url);
    expect(result.source).toBe('facebook');
    expect(result.medium).toBe('social');
    expect(result.campaign).toBe('summer_sale');
    expect(result.term).toBe('banner');
    expect(result.content).toBe('top_banner');
  });

  it('ignores non-UTM query params', () => {
    const result = parseUtmUrl('https://example.com?foo=bar&utm_source=test&baz=qux');
    expect(result.source).toBe('test');
  });

  it('throws on invalid URL', () => {
    expect(() => parseUtmUrl('not-a-url')).toThrow('Invalid URL');
  });

  it('returns empty object for URL with query but no UTM params', () => {
    const result = parseUtmUrl('https://example.com?foo=bar');
    expect(result).toEqual({});
  });
});

describe('validateUtmParameters', () => {
  it('returns valid when parameters are empty', () => {
    const result = validateUtmParameters({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('returns valid for well-formed parameters', () => {
    const params: UtmParameters = {
      source: 'newsletter',
      medium: 'email',
      campaign: 'welcome',
    };
    const result = validateUtmParameters(params);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('flags missing required source', () => {
    const params: UtmParameters = {
      campaign: 'test',
    };
    const result = validateUtmParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('source is recommended for UTM parameters');
  });

  it('flags missing required medium', () => {
    const params: UtmParameters = {
      source: 'google',
    };
    const result = validateUtmParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('medium is recommended for UTM parameters');
  });

  it('flags missing required campaign', () => {
    const params: UtmParameters = {
      source: 'google',
      medium: 'cpc',
    };
    const result = validateUtmParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('campaign is recommended for UTM parameters');
  });

  it('allows all five parameters', () => {
    const params: UtmParameters = {
      source: 'google',
      medium: 'cpc',
      campaign: 'spring_sale',
      term: 'running+shoes',
      content: 'ad_variant_a',
    };
    const result = validateUtmParameters(params);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('counts all fields including optional ones', () => {
    const params: UtmParameters = {
      source: 'facebook',
      medium: 'social',
      campaign: 'test',
      term: 'keyword',
      content: 'cta',
    };
    const result = validateUtmParameters(params);
    expect(result.fieldCount).toBe(5);
  });

  it('counts fields for partially filled params', () => {
    const params: UtmParameters = { source: 'email' };
    const result = validateUtmParameters(params);
    expect(result.fieldCount).toBe(1);
  });
});

describe('constants', () => {
  it('UTM_TEMPLATES is an array', () => {
    expect(Array.isArray(UTM_TEMPLATES)).toBe(true);
  });

  it('UTM_MEDIUMS is an array with expected entries', () => {
    expect(Array.isArray(UTM_MEDIUMS)).toBe(true);
    expect(UTM_MEDIUMS).toContain('cpc');
    expect(UTM_MEDIUMS).toContain('email');
    expect(UTM_MEDIUMS).toContain('social');
  });

  it('UTM_SOURCES is an array with expected entries', () => {
    expect(Array.isArray(UTM_SOURCES)).toBe(true);
    expect(UTM_SOURCES).toContain('google');
    expect(UTM_SOURCES).toContain('facebook');
  });
});