import { describe, expect, it } from 'vitest';
import {
  assertSafeOutboundUrl,
  isSafeOutboundUrl,
  OutboundUrlBlockedError,
} from './outbound-url';

describe('assertSafeOutboundUrl', () => {
  it('allows public HTTPS URLs', () => {
    const parsed = assertSafeOutboundUrl('https://example.com/path');
    expect(parsed.hostname).toBe('example.com');
  });

  it('blocks localhost', () => {
    expect(() => assertSafeOutboundUrl('http://localhost/admin')).toThrow(
      OutboundUrlBlockedError,
    );
  });

  it('blocks loopback IPv4', () => {
    expect(() => assertSafeOutboundUrl('http://127.0.0.1/')).toThrow(
      OutboundUrlBlockedError,
    );
  });

  it('blocks link-local metadata IP', () => {
    expect(() => assertSafeOutboundUrl('http://169.254.169.254/latest/meta-data')).toThrow(
      OutboundUrlBlockedError,
    );
  });

  it('blocks private RFC1918 ranges', () => {
    expect(() => assertSafeOutboundUrl('http://192.168.1.1/')).toThrow(
      OutboundUrlBlockedError,
    );
    expect(() => assertSafeOutboundUrl('http://10.0.0.5/')).toThrow(
      OutboundUrlBlockedError,
    );
  });

  it('blocks IPv6 loopback', () => {
    expect(() => assertSafeOutboundUrl('http://[::1]/')).toThrow(
      OutboundUrlBlockedError,
    );
  });

  it('blocks non-HTTP protocols', () => {
    expect(() => assertSafeOutboundUrl('file:///etc/passwd')).toThrow(
      OutboundUrlBlockedError,
    );
  });

  it('blocks decimal-encoded loopback IPs', () => {
    expect(() => assertSafeOutboundUrl('http://2130706433/')).toThrow(
      OutboundUrlBlockedError,
    );
  });
});

describe('isSafeOutboundUrl', () => {
  it('returns true for safe URLs', () => {
    expect(isSafeOutboundUrl('https://zhort.de')).toBe(true);
  });

  it('returns false for blocked URLs', () => {
    expect(isSafeOutboundUrl('http://127.0.0.1/')).toBe(false);
  });
});
